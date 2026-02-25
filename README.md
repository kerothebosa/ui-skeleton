# @kerothebosa/ui-skeleton-net

Network-aware skeleton loading for modern web apps.  
Patch `fetch` and `XMLHttpRequest`, then drive skeleton visibility from real request lifecycle with predictable timing controls and typed hooks.
[![npm downloads](https://img.shields.io/npm/dt/@kerothebosa/ui-skeleton-net)](https://www.npmjs.com/package/@kerothebosa/ui-skeleton-net)
[![CI](https://github.com/kerothebosa/ui-skeleton/actions/workflows/ci.yml/badge.svg)](https://github.com/kerothebosa/ui-skeleton/actions/workflows/ci.yml)
[![Pages](https://github.com/kerothebosa/ui-skeleton/actions/workflows/pages.yml/badge.svg)](https://github.com/kerothebosa/ui-skeleton/actions/workflows/pages.yml)
[![npm version](https://img.shields.io/npm/v/@kerothebosa/ui-skeleton-net.svg)](https://www.npmjs.com/package/@kerothebosa/ui-skeleton-net)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@kerothebosa/ui-skeleton-net)](https://bundlephobia.com/package/@kerothebosa/ui-skeleton-net)
[![license](https://img.shields.io/npm/l/@kerothebosa/ui-skeleton-net.svg)](./LICENSE)

## Why This Package

Most loading UIs rely on scattered `isLoading` flags and drift away from actual network behavior.  
`@kerothebosa/ui-skeleton-net` centralizes this at the transport layer and gives you consistent skeleton timing across your app.

### Highlights

- Framework-agnostic runtime integration
- Intercepts both `fetch` and `XMLHttpRequest`
- Timing controls to reduce flicker (`showDelayMs`, `minVisibleMs`)
- Typed lifecycle hooks for observability and analytics
- Publish-ready distribution (`ESM`, `CJS`, `d.ts`, `styles.css`)

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

### Styling Requirement

The stylesheet is not auto-injected by bundlers. Import it explicitly:

```ts
import "@kerothebosa/ui-skeleton-net/styles.css";
```

## Configuration At A Glance

| Option | Type | Purpose |
| --- | --- | --- |
| `showDelayMs` | `number` | Delay skeleton reveal to avoid flashing on fast requests. |
| `minVisibleMs` | `number` | Keep skeleton visible long enough for stable perceived UX. |
| `requestTimeoutMs` | `number` | Timeout threshold for request lifecycle handling. |
| `timeoutMode` | `"abort" \| "synthetic"` | Abort transport or only finalize UI lifecycle. |
| `enabledInterceptors` | `Array<"fetch" \| "xhr">` | Select observed network transports. |
| `skeletonVisuals` | `object` | Visual mode, animation, theme, and adaptive placeholder behavior. |

Full options and types:  
https://kerothebosa.github.io/ui-skeleton/api-reference

## Events And Hooks Example

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

## Demo

- Live demo: https://kerothebosa.github.io/ui-skeleton/demo/
- Local demo dev: `npm run demo:dev`
- Local demo preview: `npm run demo:preview`

## Documentation

- Docs homepage: https://kerothebosa.github.io/ui-skeleton/
- Architecture: https://kerothebosa.github.io/ui-skeleton/architecture
- Lifecycle & Events: https://kerothebosa.github.io/ui-skeleton/lifecycle-and-events
- API Reference: https://kerothebosa.github.io/ui-skeleton/api-reference
- Interceptors: https://kerothebosa.github.io/ui-skeleton/interceptors
- Testing: https://kerothebosa.github.io/ui-skeleton/testing
- Playground: https://kerothebosa.github.io/ui-skeleton/playground
- Real-World Testing: https://kerothebosa.github.io/ui-skeleton/real-world-testing
- Internal docs index: `docs/README.md`

## Browser And Runtime Support

- Modern browsers with `fetch` and `XMLHttpRequest`
- Node.js `>=18` for tooling, CI, and local docs/demo builds

## Development Scripts

- `npm run build` - Build package outputs (`dist/`)
- `npm run demo:dev` - Run local playground demo
- `npm run docs:dev` - Run VitePress docs locally
- `npm run ci` - Lint + typecheck + tests + e2e + pack check

## Project Standards

- Contributing: `CONTRIBUTING.md`
- Code of Conduct: `CODE_OF_CONDUCT.md`
- Security: `SECURITY.md`
- Changelog: `CHANGELOG.md`
- License: `LICENSE`
