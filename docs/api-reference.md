# API Reference

## `SkeletonEnhancerOptions`

```ts
type SkeletonEnhancerOptions = {
  skeletonSelector?: string;
  skeletonClassName?: string;
  overlayClassName?: string;
  skeletonVisuals?: {
    mode?: "overlay" | "adaptive" | "hybrid";
    animation?: "shimmer" | "wave" | "pulse" | "breathe" | "none";
    theme?:
      | "classic"
      | "cool"
      | "warm"
      | "contrast"
      | {
          baseColor: string;
          highlightColor: string;
          durationMs?: number;
          easing?: string;
        };
    adaptive?: {
      maxDepth?: number;
      maxPlaceholders?: number;
      minBlockHeightPx?: number;
      lineGapPx?: number;
      ignoreSelectors?: string[];
    };
  };
  requestTimeoutMs?: number;
  timeoutMode?: "abort" | "synthetic";
  showDelayMs?: number;
  minVisibleMs?: number;
  enabledInterceptors?: Array<"fetch" | "xhr">;
  shouldHandleRequest?: (ctx: {
    url: string;
    method: string;
    source: "fetch" | "xhr" | string;
  }) => boolean;
  debug?: boolean;
  hooks?: SkeletonEnhancerHooks;
};
```

## Style Import

```ts
import "@kerothebosa/ui-skeleton-net/styles.css";
```

`overlayClassName` defaults to `sknet-skeleton-overlay` and maps to the packaged CSS class.
When `skeletonVisuals.mode` is `hybrid` (default), runtime tries element-aware placeholders first and
falls back to overlay when adaptive layout cannot be derived safely.
Adaptive rendering is fail-safe: malformed or empty `ignoreSelectors` inputs do not prevent skeleton
rendering; runtime falls back to overlay when adaptive placeholder generation cannot complete.

## Visual Preset Example

```ts
const enhancer = new SkeletonEnhancer({
  skeletonSelector: "#content",
  skeletonVisuals: {
    mode: "hybrid",
    animation: "wave",
    theme: "cool"
  }
});
```

## Custom Theme Example

```ts
const enhancer = new SkeletonEnhancer({
  skeletonSelector: "#content",
  skeletonVisuals: {
    mode: "adaptive",
    animation: "pulse",
    theme: {
      baseColor: "#dde5f2",
      highlightColor: "#f8fbff",
      durationMs: 900,
      easing: "ease-in-out"
    }
  }
});
```

## `SkeletonEnhancer` Methods

- `start(): void`
- `stop(): void`
- `destroy(): void`
- `on(event, handler): SkeletonEnhancer`
- `off(event, handler): SkeletonEnhancer`
- `registerInterceptor(interceptor): SkeletonEnhancer`
- `unregisterInterceptor(name: string): SkeletonEnhancer`
- `isRunning(): boolean`
- `getState(): "idle" | "running" | "stopped" | "destroyed"`

## Event Payloads

### `request:start`

```ts
{
  requestId: string;
  url: string;
  method: string;
  source: "fetch" | "xhr" | string;
  startedAt: number;
}
```

### `request:end`

```ts
{
  requestId: string;
  url: string;
  method: string;
  source: "fetch" | "xhr" | string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  ok: boolean;
  status: number;
  aborted?: boolean;
}
```

### `skeleton:show` / `skeleton:hide`

```ts
{
  requestId: string;
  target: Element | null;
}
```

### `error`

```ts
{
  requestId?: string;
  url?: string;
  method?: string;
  source?: "fetch" | "xhr" | string;
  error: Error;
}
```
