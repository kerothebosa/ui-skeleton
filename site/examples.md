# Examples

Use these copy/paste-ready snippets to integrate `@kerothebosa/ui-skeleton-net` quickly, then tune behavior for production UX.

## Minimal Integration

This is the fastest setup to connect skeleton visibility to real network activity.

```ts
import { SkeletonEnhancer } from "@kerothebosa/ui-skeleton-net";
import "@kerothebosa/ui-skeleton-net/styles.css";

const enhancer = new SkeletonEnhancer({
  skeletonSelector: "#app-content"
});

enhancer.start();
```

## Preset-Like Advanced Configuration

Use this when you need tighter control over timing and adaptive placeholder generation.

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

Use hooks for observability, analytics, and debugging lifecycle transitions.

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

- Live demo: <a href="https://kerothebosa.github.io/ui-skeleton/demo/" target="_blank" rel="noreferrer">open in new tab</a>
- Local demo dev server: `npm run demo:dev`
- Local demo preview (built): `npm run demo:preview`

<section class="page-flow-card">
  <p><strong>Next steps:</strong> move from snippets to full option contracts in the <a href="./api-reference">API Reference</a>.</p>
  <p>Need route-level behavior validation? Continue to the <a href="./playground">Playground guide</a>.</p>
</section>
