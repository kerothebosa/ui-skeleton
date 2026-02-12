---
layout: home
title: "@kerothebosa/ui-skeleton-net"
hero:
  name: "@kerothebosa/ui-skeleton-net"
  text: "Production-Grade Skeleton Loading Driven by Real Network Signals"
  tagline: "A framework-agnostic enhancer that patches fetch/xhr, stabilizes loading UX with timing controls, and exposes typed lifecycle hooks."
  actions:
    - theme: brand
      text: Install + Quick Start
      link: /examples
    - theme: alt
      text: API Reference
      link: /api-reference
    - theme: alt
      text: Live Demo
      link: https://kerothebosa.github.io/ui-skeleton/demo/
features:
  - title: Framework-agnostic by design
    details: Use it in vanilla apps or framework stacks without rewriting your data-loading architecture.
  - title: Predictable request timing behavior
    details: Control show delay, minimum visible time, and request timeout handling to reduce flicker.
  - title: Typed lifecycle hooks and events
    details: Observe request start/end/error plus skeleton show/hide with payloads ready for telemetry.
  - title: Release and CI disciplined
    details: Built output is ESM+CJS+d.ts, with lint/type/test/e2e/pack checks in pipeline.
---

<section class="home-trust-strip">
  <div class="home-trust-item">
    <strong>Publish-ready output</strong>
    <span>ESM, CJS, d.ts, and styles entry</span>
  </div>
  <div class="home-trust-item">
    <strong>CI-gated workflow</strong>
    <span>Lint, typecheck, tests, e2e, pack-check</span>
  </div>
  <div class="home-trust-item">
    <strong>Typed hooks</strong>
    <span>Request and skeleton lifecycle observability</span>
  </div>
  <div class="home-trust-item">
    <strong>fetch + xhr coverage</strong>
    <span>Network interception for both major browser transports</span>
  </div>
</section>

## Install In 60 Seconds

```bash
npm install @kerothebosa/ui-skeleton-net
```

## Quick Start In 3 Steps

1. Import the package and its stylesheet.
2. Create `SkeletonEnhancer` with your selector and timing config.
3. Call `start()` once your app initializes.

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

<section class="home-cta-inline">
  <a class="home-cta-link" href="https://kerothebosa.github.io/ui-skeleton/demo/" target="_blank" rel="noreferrer">
    Open Live Demo in New Tab
  </a>
</section>

## Configuration Highlights

| Option | Type | Why you might tune it |
| --- | --- | --- |
| `showDelayMs` | `number` | Avoid showing skeletons for very fast responses. |
| `minVisibleMs` | `number` | Prevent flicker by keeping shown skeletons visible long enough. |
| `requestTimeoutMs` | `number` | Define timeout threshold for request lifecycle handling. |
| `timeoutMode` | `"abort" \| "synthetic"` | Choose transport abort or UI-only timeout behavior. |
| `enabledInterceptors` | `Array<"fetch" \| "xhr">` | Enable only the network transports you need. |
| `skeletonVisuals` | object | Configure mode, animation, theme, and adaptive behavior. |

## Use It When

<section class="home-duo">
  <div class="home-duo-card">
    <h3>Best Fit</h3>
    <ul>
      <li>You want skeleton behavior tied to real request lifecycle.</li>
      <li>You need consistent loading UX across pages and teams.</li>
      <li>You want telemetry-ready lifecycle hooks without custom plumbing.</li>
    </ul>
  </div>
  <div class="home-duo-card">
    <h3>Not The Right Fit</h3>
    <ul>
      <li>Your app already has a complete, request-aware loading orchestration layer.</li>
      <li>You cannot patch global fetch/xhr in your runtime constraints.</li>
      <li>You only need static placeholder markup without lifecycle logic.</li>
    </ul>
  </div>
</section>

## Continue With The Docs

<section class="home-next-grid">
  <a class="home-next-card" href="/architecture">
    <h3>Architecture</h3>
    <p>Understand core modules, data flow, and runtime boundaries.</p>
  </a>
  <a class="home-next-card" href="/lifecycle-and-events">
    <h3>Lifecycle &amp; Events</h3>
    <p>See exact event timing and payload semantics.</p>
  </a>
  <a class="home-next-card" href="/api-reference">
    <h3>API Reference</h3>
    <p>Review public options, types, and method contracts.</p>
  </a>
  <a class="home-next-card" href="/playground">
    <h3>Playground Guide</h3>
    <p>Run local scenarios and compare behavior with and without the package.</p>
  </a>
</section>
