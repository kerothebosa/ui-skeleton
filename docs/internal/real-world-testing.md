# Real-World Testing Guide

Use this guide to validate `@kerothebosa/ui-skeleton-net` in a real application before release.

## 1) Install The Package Like A Consumer

Build and pack from this repo:

```bash
npm run build
npm pack
```

In a separate app project, install the tarball:

```bash
npm install ../ui-skeleton/kerothebosa-ui-skeleton-net-0.1.0.tgz
```

## 2) Minimal Integration In A Real App

```ts
import { SkeletonEnhancer } from "@kerothebosa/ui-skeleton-net";
import "@kerothebosa/ui-skeleton-net/styles.css";

const enhancer = new SkeletonEnhancer({
  skeletonSelector: "#app-content",
  skeletonVisuals: {
    mode: "hybrid",
    animation: "wave",
    theme: "cool"
  },
  timeoutMode: "abort",
  showDelayMs: 120,
  minVisibleMs: 180,
  requestTimeoutMs: 15_000
});

enhancer.start();
```

## 3) Required Runtime Scenarios

Validate all scenarios manually in browser devtools:

1. Fast request (< `showDelayMs`): skeleton should not appear.
2. Delayed success: skeleton appears, then hides after response.
3. HTTP error response: `error` hook/event fires, no stale overlay remains.
4. Timeout in `abort` mode: request is canceled when possible and skeleton clears.
5. Timeout in `synthetic` mode: request may continue, UI tracking still finishes once.
6. Concurrent requests: overlay should remain until all tracked requests finish.
7. Stop/destroy during in-flight request: overlay must be removed and no leaks remain.
8. Missing selector target: no crash, safe no-op behavior.

## 4) Browser Matrix

Test at least:

1. Chromium (latest stable)
2. Firefox (latest stable)
3. WebKit/Safari (latest stable)

Check:

1. Overlay rendering
2. Animation behavior
3. Abort/timeout behavior
4. Console errors/warnings

## 5) Observability In Staging

Attach hooks to verify event flow:

```ts
const enhancer = new SkeletonEnhancer({
  hooks: {
    onRequestStart: (e) => console.log("start", e.requestId, e.url),
    onRequestEnd: (e) => console.log("end", e.requestId, e.status, e.durationMs),
    onError: (e) => console.error("error", e.requestId, e.error.message)
  }
});
```

Expect exactly one terminal `request:end` per tracked request.

## 6) Pre-Release Gate

Before publish, run:

```bash
npm run ci
npm run pack:check
```

Then re-test the installed tarball in a real app once more.

## 7) Playground Comparison Pass (Recommended)

Run side-by-side manual QA before publish:

```bash
npm run demo:dev
```

Then validate route scenarios at `http://127.0.0.1:4174/#/overview`:

1. `with package` side shows skeletons/animations
2. `without package` side remains blank/pop-in during loading
3. overview preset/config changes affect all tabs
4. config bootstrapping works from URL (`?config=./config/default.json`)
