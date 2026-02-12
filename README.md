# @kerothebosa/ui-skeleton-net

Framework-agnostic skeleton loader enhancer driven by real network lifecycle (`fetch` + `XMLHttpRequest`) with timing controls, adaptive visuals, and typed hooks.

[![CI](https://github.com/kerothebosa/ui-skeleton/actions/workflows/ci.yml/badge.svg)](https://github.com/kerothebosa/ui-skeleton/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@kerothebosa/ui-skeleton-net.svg)](https://www.npmjs.com/package/@kerothebosa/ui-skeleton-net)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@kerothebosa/ui-skeleton-net)](https://bundlephobia.com/package/@kerothebosa/ui-skeleton-net)
[![license](https://img.shields.io/npm/l/@kerothebosa/ui-skeleton-net.svg)](./LICENSE)

## Why This Exists

`@kerothebosa/ui-skeleton-net` targets a common UX gap: loading states that are disconnected from real request behavior.
Instead of manual `isLoading` flags spread across components, it tracks network activity and coordinates skeleton visibility with consistent timing rules.

## Installation

```bash
npm install @kerothebosa/ui-skeleton-net
```

## Quick Start

```ts
import { SkeletonEnhancer } from "@kerothebosa/ui-skeleton-net";
import "@kerothebosa/ui-skeleton-net/styles.css";

const enhancer = new SkeletonEnhancer({
  skeletonSelector: "#content",
  showDelayMs: 120,
  minVisibleMs: 180,
  requestTimeoutMs: 10_000,
  timeoutMode: "abort",
  enabledInterceptors: ["fetch", "xhr"]
});

enhancer.start();
```

## Styling Import Note

Default styles are not auto-injected by bundlers. Import this explicitly:

```ts
import "@kerothebosa/ui-skeleton-net/styles.css";
```

## Configuration Overview

| Option | Type | Purpose |
| --- | --- | --- |
| `showDelayMs` | `number` | Delay before showing skeleton to avoid flicker on fast responses. |
| `minVisibleMs` | `number` | Minimum skeleton display duration once shown. |
| `requestTimeoutMs` | `number` | Per-request timeout threshold for lifecycle handling. |
| `timeoutMode` | `"abort" \| "synthetic"` | Abort request vs stop UI tracking without aborting transport. |
| `enabledInterceptors` | `Array<"fetch" \| "xhr">` | Select network transports to observe. |
| `skeletonVisuals` | object | Visual mode/theme/animation/adaptive placeholder behavior. |

## API Overview

`SkeletonEnhancer` exposes:

- lifecycle: `start()`, `stop()`, `destroy()`, `isRunning()`
- events: `on(event, handler)`, `off(event, handler)`
- interceptor control: `registerInterceptor()`, `unregisterInterceptor()`

Full contracts and event payloads: [API Reference](https://kerothebosa.github.io/ui-skeleton/api-reference)

## Events / Hooks Example

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

## Demos

- Live demo (GitHub Pages): https://kerothebosa.github.io/ui-skeleton/demo/
- Local demo: `npm run demo:dev` then open `http://127.0.0.1:4174/#/overview`

## Documentation

- Docs site: https://kerothebosa.github.io/ui-skeleton/
- Architecture: https://kerothebosa.github.io/ui-skeleton/architecture
- Lifecycle & Events: https://kerothebosa.github.io/ui-skeleton/lifecycle-and-events
- API Reference: https://kerothebosa.github.io/ui-skeleton/api-reference
- Interceptors: https://kerothebosa.github.io/ui-skeleton/interceptors
- Testing: https://kerothebosa.github.io/ui-skeleton/testing
- Playground: https://kerothebosa.github.io/ui-skeleton/playground
- Real-World Testing: https://kerothebosa.github.io/ui-skeleton/real-world-testing
- Internal docs index (source of truth): `docs/README.md`

## Browser Support

- Modern browsers with `fetch` and `XMLHttpRequest`
- Node.js `>=18` for package tooling, local CI, and docs/demo builds

## Project Health

- Contributing: `CONTRIBUTING.md`
- Code of Conduct: `CODE_OF_CONDUCT.md`
- Security Policy: `SECURITY.md`
- Changelog: `CHANGELOG.md`
- License: `LICENSE`
