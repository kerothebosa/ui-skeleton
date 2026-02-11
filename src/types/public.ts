export type BuiltinInterceptorName = "fetch" | "xhr";
export type SkeletonRequestSource = BuiltinInterceptorName | string;
export type TimeoutMode = "abort" | "synthetic";

export type RequestFilterContext = {
  url: string;
  method: string;
  source: SkeletonRequestSource;
};

export type RequestStartPayload = RequestFilterContext & {
  requestId: string;
  startedAt: number;
};

export type RequestEndPayload = RequestStartPayload & {
  endedAt: number;
  durationMs: number;
  ok: boolean;
  status: number;
  aborted?: boolean;
};

export type SkeletonEnhancerEventMap = {
  "request:start": RequestStartPayload;
  "request:end": RequestEndPayload;
  "skeleton:show": {
    requestId: string;
    target: Element | null;
  };
  "skeleton:hide": {
    requestId: string;
    target: Element | null;
  };
  error: {
    requestId?: string;
    url?: string;
    method?: string;
    source?: SkeletonRequestSource;
    error: Error;
  };
};

export type SkeletonEventName = keyof SkeletonEnhancerEventMap;

export type SkeletonEventHandler<K extends SkeletonEventName> = (
  payload: SkeletonEnhancerEventMap[K]
) => void;

export type SkeletonEnhancerHooks = {
  onRequestStart?: SkeletonEventHandler<"request:start">;
  onRequestEnd?: SkeletonEventHandler<"request:end">;
  onSkeletonShow?: SkeletonEventHandler<"skeleton:show">;
  onSkeletonHide?: SkeletonEventHandler<"skeleton:hide">;
  onError?: SkeletonEventHandler<"error">;
};

export type SkeletonEnhancerOptions = {
  skeletonSelector?: string;
  skeletonClassName?: string;
  overlayClassName?: string;
  requestTimeoutMs?: number;
  timeoutMode?: TimeoutMode;
  showDelayMs?: number;
  minVisibleMs?: number;
  enabledInterceptors?: BuiltinInterceptorName[];
  shouldHandleRequest?: (ctx: RequestFilterContext) => boolean;
  debug?: boolean;
  hooks?: SkeletonEnhancerHooks;
};

export interface NetworkInterceptor {
  readonly name: string;
  install(): void;
  uninstall(): void;
  isInstalled(): boolean;
}
