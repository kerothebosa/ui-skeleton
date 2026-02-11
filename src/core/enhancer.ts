import { SkeletonManager } from "../dom/skeleton-manager";
import { FetchInterceptor } from "../network/fetch-interceptor";
import type {
  NetworkEventSubscriber,
  NetworkRequestEndEvent,
  NetworkRequestErrorEvent,
  NetworkRequestStartEventWithControl
} from "../network/types";
import { XhrInterceptor } from "../network/xhr-interceptor";
import { EventBus } from "../orchestrator/event-bus";
import type { EnhancerLifecycleState } from "../types/internal";
import type {
  BuiltinInterceptorName,
  NetworkInterceptor,
  SkeletonEnhancerEventMap,
  SkeletonEnhancerHooks,
  SkeletonEnhancerOptions,
  SkeletonEventHandler,
  SkeletonEventName,
  SkeletonRequestSource,
  TimeoutMode
} from "../types/public";
import { isBrowserEnvironment } from "../utils/guards";
import { Logger } from "../utils/logger";
import { LifecycleState } from "./lifecycle";

type TimerHandle = ReturnType<typeof setTimeout>;

type TrackedRequest = {
  requestId: string;
  url: string;
  method: string;
  source: SkeletonRequestSource;
  startedAt: number;
  visible: boolean;
  shownAt: number | null;
  completed: boolean;
  timedOut: boolean;
  canAbort: boolean;
  cancel: (() => void) | null;
  showTimer: TimerHandle | null;
  hideTimer: TimerHandle | null;
  timeoutTimer: TimerHandle | null;
  timeoutFallbackTimer: TimerHandle | null;
};

type ResolvedEnhancerOptions = {
  skeletonSelector: string;
  skeletonClassName: string;
  overlayClassName: string;
  requestTimeoutMs: number;
  timeoutMode: TimeoutMode;
  showDelayMs: number;
  minVisibleMs: number;
  enabledInterceptors: BuiltinInterceptorName[];
  debug: boolean;
  hooks?: SkeletonEnhancerHooks;
  shouldHandleRequest?: SkeletonEnhancerOptions["shouldHandleRequest"];
};

const DEFAULT_OPTIONS: ResolvedEnhancerOptions = {
  skeletonSelector: "body",
  skeletonClassName: "sknet-skeleton-active",
  overlayClassName: "sknet-skeleton-overlay",
  requestTimeoutMs: 15_000,
  timeoutMode: "abort",
  showDelayMs: 120,
  minVisibleMs: 180,
  enabledInterceptors: ["fetch", "xhr"],
  debug: false
};

export class SkeletonEnhancer {
  private state: EnhancerLifecycleState = LifecycleState.IDLE;
  private readonly bus = new EventBus<SkeletonEnhancerEventMap>();
  private readonly options: ResolvedEnhancerOptions;
  private readonly logger: Logger;
  private readonly skeletonManager: SkeletonManager;
  private readonly interceptors = new Map<string, NetworkInterceptor>();
  private readonly activeRequests = new Map<string, TrackedRequest>();
  private readonly networkSubscriber: NetworkEventSubscriber;

  constructor(options: SkeletonEnhancerOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
      enabledInterceptors: options.enabledInterceptors
        ? [...options.enabledInterceptors]
        : [...DEFAULT_OPTIONS.enabledInterceptors]
    };

    this.logger = new Logger(this.options.debug);
    this.skeletonManager = new SkeletonManager({
      selector: this.options.skeletonSelector,
      className: this.options.skeletonClassName,
      overlayClassName: this.options.overlayClassName
    });

    this.networkSubscriber = {
      onRequestStart: (event) => this.handleNetworkRequestStart(event),
      onRequestEnd: (event) => this.handleNetworkRequestEnd(event),
      onError: (event) => this.handleNetworkError(event)
    };

    this.registerInterceptor(new FetchInterceptor(this.networkSubscriber));
    this.registerInterceptor(new XhrInterceptor(this.networkSubscriber));
    this.attachHookHandlers();
  }

  start(): void {
    if (this.state === LifecycleState.DESTROYED) {
      throw new Error("SkeletonEnhancer has been destroyed and cannot be started.");
    }

    if (this.state === LifecycleState.RUNNING) {
      return;
    }

    if (!isBrowserEnvironment()) {
      this.logger.warn(
        "SkeletonEnhancer.start() skipped because no browser environment was detected."
      );
      return;
    }

    this.interceptors.forEach((interceptor, name) => {
      if (!this.shouldInstallInterceptor(name)) {
        return;
      }

      interceptor.install();
    });

    this.state = LifecycleState.RUNNING;
    this.logger.debug("Enhancer started");
  }

  stop(): void {
    if (this.state !== LifecycleState.RUNNING) {
      return;
    }

    this.interceptors.forEach((interceptor) => interceptor.uninstall());
    this.clearRequestTracking();
    this.state = LifecycleState.STOPPED;
    this.logger.debug("Enhancer stopped");
  }

  destroy(): void {
    if (this.state === LifecycleState.DESTROYED) {
      return;
    }

    this.stop();
    this.bus.removeAll();
    this.clearRequestTracking();
    this.state = LifecycleState.DESTROYED;
    this.logger.debug("Enhancer destroyed");
  }

  on<TKey extends SkeletonEventName>(
    event: TKey,
    handler: SkeletonEventHandler<TKey>
  ): SkeletonEnhancer {
    this.bus.on(event, handler);
    return this;
  }

  off<TKey extends SkeletonEventName>(
    event: TKey,
    handler: SkeletonEventHandler<TKey>
  ): SkeletonEnhancer {
    this.bus.off(event, handler);
    return this;
  }

  registerInterceptor(interceptor: NetworkInterceptor): SkeletonEnhancer {
    if (this.interceptors.has(interceptor.name)) {
      this.logger.warn(
        `Interceptor "${interceptor.name}" is already registered; ignoring duplicate.`
      );
      return this;
    }

    this.interceptors.set(interceptor.name, interceptor);
    if (this.state === LifecycleState.RUNNING && this.shouldInstallInterceptor(interceptor.name)) {
      interceptor.install();
    }

    return this;
  }

  unregisterInterceptor(name: string): SkeletonEnhancer {
    const interceptor = this.interceptors.get(name);
    if (!interceptor) {
      return this;
    }

    interceptor.uninstall();
    this.interceptors.delete(name);
    return this;
  }

  isRunning(): boolean {
    return this.state === LifecycleState.RUNNING;
  }

  getState(): EnhancerLifecycleState {
    return this.state;
  }

  private shouldInstallInterceptor(name: string): boolean {
    if (name === "fetch" || name === "xhr") {
      return this.options.enabledInterceptors.includes(name);
    }

    return true;
  }

  private handleNetworkRequestStart(event: NetworkRequestStartEventWithControl): void {
    if (this.state !== LifecycleState.RUNNING || !this.shouldHandleRequest(event)) {
      return;
    }

    if (this.activeRequests.has(event.requestId)) {
      return;
    }

    const tracker: TrackedRequest = {
      requestId: event.requestId,
      url: event.url,
      method: event.method,
      source: event.source,
      startedAt: event.startedAt,
      visible: false,
      shownAt: null,
      completed: false,
      timedOut: false,
      canAbort: event.canAbort ?? false,
      cancel: event.cancel ?? null,
      showTimer: null,
      hideTimer: null,
      timeoutTimer: null,
      timeoutFallbackTimer: null
    };

    this.activeRequests.set(event.requestId, tracker);
    this.bus.emit("request:start", event);
    this.scheduleShow(tracker);
    this.scheduleTimeout(tracker);
  }

  private handleNetworkRequestEnd(event: NetworkRequestEndEvent): void {
    const tracker = this.activeRequests.get(event.requestId);
    if (!tracker || tracker.completed) {
      return;
    }

    tracker.completed = true;
    this.clearTimer(tracker.showTimer);
    this.clearTimer(tracker.timeoutTimer);
    this.clearTimer(tracker.timeoutFallbackTimer);
    tracker.showTimer = null;
    tracker.timeoutTimer = null;
    tracker.timeoutFallbackTimer = null;

    this.bus.emit("request:end", event);

    if (!tracker.visible) {
      this.activeRequests.delete(tracker.requestId);
      return;
    }

    const visibleFor = tracker.shownAt ? Date.now() - tracker.shownAt : 0;
    const hideDelay = Math.max(0, this.options.minVisibleMs - visibleFor);

    if (hideDelay === 0) {
      this.hideSkeleton(tracker.requestId);
      return;
    }

    tracker.hideTimer = setTimeout(() => {
      tracker.hideTimer = null;
      this.hideSkeleton(tracker.requestId);
    }, hideDelay);
  }

  private handleNetworkError(event: NetworkRequestErrorEvent): void {
    const tracker = this.activeRequests.get(event.requestId);
    if (!tracker || tracker.completed) {
      return;
    }

    if (tracker.timedOut) {
      return;
    }

    this.bus.emit("error", {
      requestId: event.requestId,
      url: event.url,
      method: event.method,
      source: event.source,
      error: event.error
    });
  }

  private scheduleShow(tracker: TrackedRequest): void {
    if (this.options.showDelayMs <= 0) {
      this.showSkeleton(tracker.requestId);
      return;
    }

    tracker.showTimer = setTimeout(() => {
      tracker.showTimer = null;
      this.showSkeleton(tracker.requestId);
    }, this.options.showDelayMs);
  }

  private scheduleTimeout(tracker: TrackedRequest): void {
    if (this.options.requestTimeoutMs <= 0) {
      return;
    }

    tracker.timeoutTimer = setTimeout(() => {
      tracker.timeoutTimer = null;
      this.handleTimeout(tracker.requestId);
    }, this.options.requestTimeoutMs);
  }

  private showSkeleton(requestId: string): void {
    const tracker = this.activeRequests.get(requestId);
    if (!tracker || tracker.completed || tracker.visible) {
      return;
    }

    tracker.visible = true;
    tracker.shownAt = Date.now();
    this.skeletonManager.show(requestId);
    this.bus.emit("skeleton:show", {
      requestId,
      target: this.skeletonManager.getTarget()
    });
  }

  private hideSkeleton(requestId: string): void {
    const tracker = this.activeRequests.get(requestId);
    if (!tracker) {
      return;
    }

    if (tracker.visible) {
      this.skeletonManager.hide(requestId);
      this.bus.emit("skeleton:hide", {
        requestId,
        target: this.skeletonManager.getTarget()
      });
    }

    this.clearTimer(tracker.showTimer);
    this.clearTimer(tracker.timeoutTimer);
    this.clearTimer(tracker.hideTimer);
    this.clearTimer(tracker.timeoutFallbackTimer);
    this.activeRequests.delete(requestId);
  }

  private handleTimeout(requestId: string): void {
    const tracker = this.activeRequests.get(requestId);
    if (!tracker || tracker.completed || tracker.timedOut) {
      return;
    }

    tracker.timedOut = true;

    const error = new Error(`Request timed out after ${this.options.requestTimeoutMs}ms`);
    this.bus.emit("error", {
      requestId,
      url: tracker.url,
      method: tracker.method,
      source: tracker.source,
      error
    });

    if (this.options.timeoutMode === "abort" && tracker.canAbort && tracker.cancel) {
      tracker.cancel();
      tracker.timeoutFallbackTimer = setTimeout(() => {
        tracker.timeoutFallbackTimer = null;
        this.finalizeTimedOutRequest(requestId, true);
      }, 150);
      return;
    }

    this.finalizeTimedOutRequest(requestId, false);
  }

  private finalizeTimedOutRequest(requestId: string, aborted: boolean): void {
    const tracker = this.activeRequests.get(requestId);
    if (!tracker || tracker.completed) {
      return;
    }

    const endedAt = Date.now();
    this.handleNetworkRequestEnd({
      requestId,
      url: tracker.url,
      method: tracker.method,
      source: tracker.source,
      startedAt: tracker.startedAt,
      endedAt,
      durationMs: endedAt - tracker.startedAt,
      ok: false,
      status: 0,
      aborted
    });
  }

  private shouldHandleRequest(event: NetworkRequestStartEventWithControl): boolean {
    if (!this.options.shouldHandleRequest) {
      return true;
    }

    try {
      return this.options.shouldHandleRequest({
        url: event.url,
        method: event.method,
        source: event.source
      });
    } catch (error) {
      this.logger.warn("shouldHandleRequest callback failed; defaulting to handle request.", error);
      return true;
    }
  }

  private clearRequestTracking(): void {
    this.activeRequests.forEach((tracker) => {
      this.clearTimer(tracker.showTimer);
      this.clearTimer(tracker.hideTimer);
      this.clearTimer(tracker.timeoutTimer);
      this.clearTimer(tracker.timeoutFallbackTimer);
    });
    this.activeRequests.clear();
    this.skeletonManager.cleanup();
  }

  private clearTimer(timer: TimerHandle | null): void {
    if (timer) {
      clearTimeout(timer);
    }
  }

  private attachHookHandlers(): void {
    if (this.options.hooks?.onRequestStart) {
      this.on("request:start", this.options.hooks.onRequestStart);
    }

    if (this.options.hooks?.onRequestEnd) {
      this.on("request:end", this.options.hooks.onRequestEnd);
    }

    if (this.options.hooks?.onSkeletonShow) {
      this.on("skeleton:show", this.options.hooks.onSkeletonShow);
    }

    if (this.options.hooks?.onSkeletonHide) {
      this.on("skeleton:hide", this.options.hooks.onSkeletonHide);
    }

    if (this.options.hooks?.onError) {
      this.on("error", this.options.hooks.onError);
    }
  }
}
