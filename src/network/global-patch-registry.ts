import { isFetchAvailable, isXmlHttpRequestAvailable } from "../utils/guards";
import type {
  NetworkEventSubscriber,
  NetworkRequestEndEvent,
  NetworkRequestStartEventWithControl
} from "./types";

type SubscriberMap = Map<number, NetworkEventSubscriber>;

const FETCH_SOURCE = "fetch";
const XHR_SOURCE = "xhr";
const XHR_META = Symbol("sknet:xhr-meta");

type XhrMeta = {
  requestId: string;
  method: string;
  url: string;
  startedAt: number;
  finalized: boolean;
};

type InstrumentedXhr = XMLHttpRequest & { [XHR_META]?: XhrMeta };

let subscriberIdCounter = 0;

let fetchSubscribers: SubscriberMap = new Map();
let xhrSubscribers: SubscriberMap = new Map();

let originalFetch: typeof globalThis.fetch | null = null;
let originalXhrOpen: XMLHttpRequest["open"] | null = null;
let originalXhrSend: XMLHttpRequest["send"] | null = null;

let fetchRequestCounter = 0;
let xhrRequestCounter = 0;

const activeXhrRequests = new Map<string, InstrumentedXhr>();

const withSubscribers = (
  subscribers: SubscriberMap,
  invoke: (subscriber: NetworkEventSubscriber) => void
): void => {
  subscribers.forEach((subscriber) => invoke(subscriber));
};

const toError = (error: unknown): Error => {
  return error instanceof Error ? error : new Error(String(error));
};

const isAbortError = (error: Error): boolean => {
  return error.name === "AbortError";
};

const getAbortReason = (signal: AbortSignal): unknown => {
  if ("reason" in signal) {
    return signal.reason;
  }

  return new Error("Aborted");
};

const composeAbortSignals = (
  left?: AbortSignal | null,
  right?: AbortSignal | null
): AbortSignal | undefined => {
  if (!left && !right) {
    return undefined;
  }

  if (!left) {
    return right ?? undefined;
  }

  if (!right) {
    return left ?? undefined;
  }

  const abortSignalWithAny = AbortSignal as typeof AbortSignal & {
    any?: (signals: AbortSignal[]) => AbortSignal;
  };
  if (typeof abortSignalWithAny.any === "function") {
    return abortSignalWithAny.any([left, right]);
  }

  const compositeController = new AbortController();
  const abort = (signal: AbortSignal): void => {
    if (compositeController.signal.aborted) {
      return;
    }

    compositeController.abort(getAbortReason(signal));
  };

  if (left.aborted) {
    abort(left);
  } else {
    left.addEventListener("abort", () => abort(left), { once: true });
  }

  if (right.aborted) {
    abort(right);
  } else {
    right.addEventListener("abort", () => abort(right), { once: true });
  }

  return compositeController.signal;
};

const resolveFetchMethod = (input: RequestInfo | URL, init?: RequestInit): string => {
  if (init?.method) {
    return init.method.toUpperCase();
  }

  if (typeof Request !== "undefined" && input instanceof Request) {
    return input.method.toUpperCase();
  }

  return "GET";
};

const resolveFetchUrl = (input: RequestInfo | URL): string => {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
};

const emitFetchStart = (event: NetworkRequestStartEventWithControl): void => {
  withSubscribers(fetchSubscribers, (subscriber) => subscriber.onRequestStart(event));
};

const emitFetchEnd = (event: NetworkRequestEndEvent): void => {
  withSubscribers(fetchSubscribers, (subscriber) => subscriber.onRequestEnd(event));
};

const emitXhrStart = (event: NetworkRequestStartEventWithControl): void => {
  withSubscribers(xhrSubscribers, (subscriber) => subscriber.onRequestStart(event));
};

const emitXhrEnd = (event: NetworkRequestEndEvent): void => {
  withSubscribers(xhrSubscribers, (subscriber) => subscriber.onRequestEnd(event));
};

const ensureFetchPatch = (): void => {
  if (originalFetch || !isFetchAvailable()) {
    return;
  }

  originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const startedAt = Date.now();
    const requestId = `fetch-${++fetchRequestCounter}`;
    const method = resolveFetchMethod(input, init);
    const url = resolveFetchUrl(input);
    const timeoutController =
      typeof AbortController !== "undefined" ? new AbortController() : undefined;
    const signal = composeAbortSignals(init?.signal, timeoutController?.signal);
    const nextInit = signal ? { ...(init ?? {}), signal } : init;

    const startEvent: NetworkRequestStartEventWithControl = {
      requestId,
      method,
      url,
      source: FETCH_SOURCE,
      startedAt,
      canAbort: Boolean(timeoutController),
      cancel: timeoutController
        ? () => {
            if (!timeoutController.signal.aborted) {
              timeoutController.abort(new Error("Cancelled by @kerothebosa/ui-skeleton-net timeout policy."));
            }
          }
        : undefined
    };

    emitFetchStart(startEvent);

    let finalized = false;
    const emitTerminalEnd = (event: NetworkRequestEndEvent): void => {
      if (finalized) {
        return;
      }

      finalized = true;
      emitFetchEnd(event);
    };

    try {
      const response = await originalFetch!(input, nextInit);
      const endedAt = Date.now();
      emitTerminalEnd({
        requestId,
        method,
        url,
        source: FETCH_SOURCE,
        startedAt,
        endedAt,
        durationMs: endedAt - startedAt,
        ok: response.ok,
        status: response.status,
        aborted: false
      });
      return response;
    } catch (error) {
      const normalized = toError(error);
      const endedAt = Date.now();

      withSubscribers(fetchSubscribers, (subscriber) =>
        subscriber.onError({
          requestId,
          method,
          url,
          source: FETCH_SOURCE,
          startedAt,
          error: normalized
        })
      );

      emitTerminalEnd({
        requestId,
        method,
        url,
        source: FETCH_SOURCE,
        startedAt,
        endedAt,
        durationMs: endedAt - startedAt,
        ok: false,
        status: 0,
        aborted: isAbortError(normalized)
      });
      throw error;
    }
  };
};

const cleanupFetchPatch = (): void => {
  if (fetchSubscribers.size > 0 || !originalFetch) {
    return;
  }

  globalThis.fetch = originalFetch;
  originalFetch = null;
};

const ensureXhrPatch = (): void => {
  if (originalXhrOpen || originalXhrSend || !isXmlHttpRequestAvailable()) {
    return;
  }

  originalXhrOpen = XMLHttpRequest.prototype.open;
  originalXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    this: InstrumentedXhr,
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ): void {
    this[XHR_META] = {
      requestId: this[XHR_META]?.requestId ?? "",
      method: method.toUpperCase(),
      url: String(url),
      startedAt: this[XHR_META]?.startedAt ?? 0,
      finalized: false
    };

    return originalXhrOpen!.call(
      this,
      method,
      String(url),
      async ?? true,
      username ?? null,
      password ?? null
    );
  };

  XMLHttpRequest.prototype.send = function (
    this: InstrumentedXhr,
    body?: Document | XMLHttpRequestBodyInit | null
  ): void {
    const startedAt = Date.now();
    const previousMeta = this[XHR_META];
    const requestId = `xhr-${++xhrRequestCounter}`;
    const method = previousMeta?.method ?? "GET";
    const url = previousMeta?.url ?? "";
    const startEvent: NetworkRequestStartEventWithControl = {
      requestId,
      method,
      url,
      source: XHR_SOURCE,
      startedAt,
      canAbort: true,
      cancel: () => {
        const pending = activeXhrRequests.get(requestId);
        if (pending && pending.readyState !== XMLHttpRequest.DONE) {
          pending.abort();
        }
      }
    };

    this[XHR_META] = {
      requestId,
      method,
      url,
      startedAt,
      finalized: false
    };

    activeXhrRequests.set(requestId, this);
    emitXhrStart(startEvent);

    const finalize = (status: number, ok: boolean, aborted: boolean): void => {
      const meta = this[XHR_META];
      if (!meta || meta.finalized) {
        return;
      }

      meta.finalized = true;
      activeXhrRequests.delete(requestId);

      const endedAt = Date.now();
      emitXhrEnd({
        requestId,
        method,
        url,
        source: XHR_SOURCE,
        startedAt,
        endedAt,
        durationMs: endedAt - startedAt,
        ok,
        status,
        aborted
      });
    };

    this.addEventListener(
      "error",
      () => {
        withSubscribers(xhrSubscribers, (subscriber) =>
          subscriber.onError({
            requestId,
            method,
            url,
            source: XHR_SOURCE,
            startedAt,
            error: new Error(`XHR error for ${method} ${url}`)
          })
        );
      },
      { once: true }
    );

    this.addEventListener(
      "abort",
      () => {
        withSubscribers(xhrSubscribers, (subscriber) =>
          subscriber.onError({
            requestId,
            method,
            url,
            source: XHR_SOURCE,
            startedAt,
            error: new Error(`XHR aborted for ${method} ${url}`)
          })
        );
      },
      { once: true }
    );

    this.addEventListener(
      "timeout",
      () => {
        withSubscribers(xhrSubscribers, (subscriber) =>
          subscriber.onError({
            requestId,
            method,
            url,
            source: XHR_SOURCE,
            startedAt,
            error: new Error(`XHR timed out for ${method} ${url}`)
          })
        );
      },
      { once: true }
    );

    this.addEventListener(
      "loadend",
      () => {
        const aborted = this.readyState === XMLHttpRequest.DONE && this.status === 0;
        const ok = this.status >= 200 && this.status < 400;
        finalize(this.status, ok, aborted);
      },
      { once: true }
    );

    return originalXhrSend!.call(this, body);
  };
};

const cleanupXhrPatch = (): void => {
  if (xhrSubscribers.size > 0 || !originalXhrOpen || !originalXhrSend) {
    return;
  }

  XMLHttpRequest.prototype.open = originalXhrOpen;
  XMLHttpRequest.prototype.send = originalXhrSend;
  originalXhrOpen = null;
  originalXhrSend = null;
  activeXhrRequests.clear();
};

export const registerFetchSubscriber = (subscriber: NetworkEventSubscriber): (() => void) => {
  const id = ++subscriberIdCounter;
  fetchSubscribers.set(id, subscriber);
  ensureFetchPatch();

  return () => {
    fetchSubscribers.delete(id);
    cleanupFetchPatch();
  };
};

export const registerXhrSubscriber = (subscriber: NetworkEventSubscriber): (() => void) => {
  const id = ++subscriberIdCounter;
  xhrSubscribers.set(id, subscriber);
  ensureXhrPatch();

  return () => {
    xhrSubscribers.delete(id);
    cleanupXhrPatch();
  };
};
