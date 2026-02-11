# API Reference

## `SkeletonEnhancerOptions`

```ts
type SkeletonEnhancerOptions = {
  skeletonSelector?: string;
  skeletonClassName?: string;
  overlayClassName?: string;
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
import "@skeleton-ui/net/styles.css";
```

`overlayClassName` defaults to `sknet-skeleton-overlay` and maps to the packaged CSS class.

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
