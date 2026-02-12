# Examples

## Minimal Integration

```ts
import { SkeletonEnhancer } from "@skeleton-ui/net";
import "@skeleton-ui/net/styles.css";

const enhancer = new SkeletonEnhancer({
  skeletonSelector: "#app-content"
});

enhancer.start();
```

## Preset-Like Advanced Configuration

```ts
const enhancer = new SkeletonEnhancer({
  skeletonSelector: "#dashboard",
  showDelayMs: 90,
  minVisibleMs: 160,
  requestTimeoutMs: 12_000,
  timeoutMode: "synthetic",
  enabledInterceptors: ["fetch", "xhr"],
  skeletonVisuals: {
    mode: "hybrid",
    animation: "wave",
    theme: "contrast",
    adaptive: {
      maxDepth: 4,
      maxPlaceholders: 180,
      minBlockHeightPx: 12,
      lineGapPx: 6,
      ignoreSelectors: [".skip-skeleton", "[data-static]"]
    }
  }
});
```

## Event Hooks Logging

```ts
const enhancer = new SkeletonEnhancer({
  hooks: {
    onRequestStart: ({ requestId, method, url }) =>
      console.log("request:start", requestId, method, url),
    onRequestEnd: ({ requestId, status, durationMs }) =>
      console.log("request:end", requestId, status, durationMs),
    onSkeletonShow: ({ requestId }) => console.log("skeleton:show", requestId),
    onSkeletonHide: ({ requestId }) => console.log("skeleton:hide", requestId),
    onError: ({ requestId, error }) => console.error("error", requestId, error.message)
  }
});
```

## Demo Links

- Live demo: `https://kerothebosa.github.io/ui-skeleton/demo/`
- Local demo dev server: `npm run demo:dev`
- Local demo preview (built): `npm run demo:preview`
