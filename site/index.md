---
layout: home
title: "@kerothebosa/ui-skeleton-net"
hero:
  name: "@kerothebosa/ui-skeleton-net"
  text: "Network-Aware Skeleton Loading for Any UI Stack"
  tagline: "Framework-agnostic fetch/xhr interceptor with lifecycle controls, adaptive placeholders, and typed hooks."
  actions:
    - theme: brand
      text: Quick Start
      link: /examples
    - theme: alt
      text: API Reference
      link: /api-reference
    - theme: alt
      text: Live Demo
      link: https://kerothebosa.github.io/ui-skeleton/demo/
features:
  - title: Works with existing apps
    details: Patch fetch/xhr at runtime and drive skeleton visibility from real request lifecycle events.
  - title: Predictable timing controls
    details: Tune show delay, minimum visible duration, and timeout behavior for stable perceived performance.
  - title: Safe lifecycle hooks
    details: Subscribe to typed start/end/error/skeleton events for logging, telemetry, or custom UI behavior.
  - title: Publish-ready package
    details: ESM + CJS + d.ts output, CI quality gates, npm pack validation, and tag-based release automation.
---

## Install

```bash
npm install @kerothebosa/ui-skeleton-net
```

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

## Where To Go Next

- Architecture: `/architecture`
- Lifecycle + events: `/lifecycle-and-events`
- API contracts: `/api-reference`
- Interceptor internals: `/interceptors`
- Playground guide: `/playground`
- Real-world validation flow: `/real-world-testing`
