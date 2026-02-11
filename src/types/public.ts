export type BuiltinInterceptorName = "fetch" | "xhr";
export type SkeletonRequestSource = BuiltinInterceptorName | string;
export type TimeoutMode = "abort" | "synthetic";
export type SkeletonRenderMode = "overlay" | "adaptive" | "hybrid";
export type SkeletonAnimationPreset = "shimmer" | "wave" | "pulse" | "breathe" | "none";
export type SkeletonThemePreset = "classic" | "cool" | "warm" | "contrast";

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

export type SkeletonAdaptiveOptions = {
  maxDepth?: number;
  maxPlaceholders?: number;
  minBlockHeightPx?: number;
  lineGapPx?: number;
  ignoreSelectors?: string[];
};

export type SkeletonThemeCustom = {
  baseColor: string;
  highlightColor: string;
  durationMs?: number;
  easing?: string;
};

export type SkeletonVisualsOptions = {
  mode?: SkeletonRenderMode;
  animation?: SkeletonAnimationPreset;
  theme?: SkeletonThemePreset | SkeletonThemeCustom;
  adaptive?: SkeletonAdaptiveOptions;
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
  skeletonVisuals?: SkeletonVisualsOptions;
  debug?: boolean;
  hooks?: SkeletonEnhancerHooks;
};

export interface NetworkInterceptor {
  readonly name: string;
  install(): void;
  uninstall(): void;
  isInstalled(): boolean;
}
