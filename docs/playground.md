# Playground Guide

This document describes the local multi-route playground in `playground/` and how it validates real consumer behavior against built artifacts in `dist/`.

## Purpose

The playground is demo/test-only code. It is used to:

- validate skeleton timing and visuals manually in a browser
- compare UX side-by-side (`with package` vs `without package`)
- exercise concurrency, timeout, error, and lifecycle scenarios across realistic pages
- test config-driven initialization patterns that mirror production app usage

## Runtime Source Of Truth

Playground always imports from built output, not `src/`:

- `../dist/index.js`
- `../dist/styles.css`

This ensures manual tests reflect published-bundle behavior.
The playground also ships a browser-side mock API so it can run on static hosts
like GitHub Pages without a Node backend.

## Route Suite

Hash routes:

- `#/overview`
- `#/dashboard`
- `#/forms`
- `#/table`
- `#/search`
- `#/workflow`
- `#/feed`
- `#/analytics`

Every route uses the same shared app shell and shared event log.

## Shared Config Model

The playground owns one global enhancer config object in `playground/main.ts`.

It controls defaults for all route-local enhancer instances:

- `showDelayMs`
- `minVisibleMs`
- `requestTimeoutMs`
- `timeoutMode`
- `enabledInterceptors`
- `skeletonVisuals` (`mode`, `animation`, `theme`, `adaptive`)

Behavior:

- changes in `#/overview` apply to all routes
- config persists in localStorage
- each route reuses the same settings via shared `createEnhancer(...)` wiring

## Config File Bootstrapping

Two supported flows:

1. startup URL:
   - `http://127.0.0.1:4174/?config=./config/default.json#/overview`
2. runtime controls in `#/overview`:
   - load URL
   - import JSON file
   - export current JSON
   - reset defaults

Sample files bundled with the playground:

- `./config/default.json`
- `./config/adaptive-contrast.json`

Accepted payload shape:

```json
{
  "schema": "@skeleton-ui/net/playground-config",
  "version": 1,
  "playgroundConfig": {
    "showDelayMs": 120,
    "minVisibleMs": 180,
    "requestTimeoutMs": 10000,
    "timeoutMode": "abort",
    "enabledInterceptors": ["fetch", "xhr"],
    "skeletonVisuals": {
      "mode": "hybrid",
      "animation": "shimmer",
      "theme": "classic",
      "adaptive": {
        "maxDepth": 4,
        "maxPlaceholders": 180,
        "minBlockHeightPx": 12,
        "lineGapPx": 6,
        "ignoreSelectors": []
      }
    }
  }
}
```

## Reliability Notes

Adaptive scanning is fail-safe:

- empty or malformed `ignoreSelectors` does not break rendering
- if adaptive placeholder generation cannot derive blocks, renderer falls back to overlay mode

This guarantees that when the enhancer reports `skeleton:show`, a visual skeleton node is still rendered.

## Commands

From repo root:

- `npm run demo:dev` (build package, run Vite demo server)
- `npm run playground` (compatibility alias to `npm run demo:dev`)
- open `http://127.0.0.1:4174/#/overview`
