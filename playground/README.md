# Playground: Real-Case Demo Suite

This directory is a demo-only app used for manual QA against built artifacts in `dist/`.
Each route renders side-by-side labs:

- left: with `@kerothebosa/ui-skeleton-net`
- right: same UI and requests without enhancer

It intentionally imports:

- `../dist/index.js`
- `../dist/styles.css`

so behavior mirrors published-bundle usage, not `src/` internals.
For static-host compatibility (GitHub Pages), API calls are handled by an in-browser mock layer.

## Run

From repo root:

```bash
npm run demo:dev
```

Then open:

```text
http://127.0.0.1:4174/#/overview
```

## Route Map

- `#/overview`: baseline timing + timeout mode + stop/destroy/restart lifecycle checks + preset bundles
- `#/dashboard`: parallel card loads, targeted refresh, stress refresh batches
- `#/forms`: dependent selects, async email validation, submit success/error simulation
- `#/table`: server filtering/sort/pagination + concurrent row-detail refresh
- `#/search`: debounced search suggestions + results pagination + failure simulation
- `#/workflow`: multi-step workflow with dependent calls and finalize path
- `#/feed`: live feed list + polling burst + post ack simulation
- `#/analytics`: report query chain + summary + export preparation

## Overview Presets

- `Classic Overlay`
- `Adaptive Wave`
- `Adaptive Pulse`
- `Hybrid Calm`
- `Hybrid Contrast`

Preset and advanced option changes are global:

- they persist in local storage
- they apply to all routes, not only `#/overview`
- each route enhancer instance is created from the same shared config

You can also adjust advanced controls:

- render mode
- animation preset
- theme preset
- show delay
- minimum visible duration
- request timeout
- timeout mode
- fetch/xhr interceptor toggles

## Config File Initialization

Real-life style config-driven usage is available in two ways:

1. Startup from URL query:
   - `http://127.0.0.1:4174/?config=./config/default.json#/overview`
2. Runtime from Overview controls:
   - `Load config URL` (for hosted JSON files)
   - `Import config JSON` (local file upload)
   - `Export config JSON` (download current shared config)
   - `Reset global config`

Sample files:

- `./config/default.json`
- `./config/adaptive-contrast.json`

## API Endpoints Used

- `/api/data`
- `/api/dashboard/kpi|activity|chart|alerts`
- `/api/forms/countries|cities|validate-email|submit`
- `/api/table/items|row-detail`
- `/api/search/suggest|results`
- `/api/workflow/step|finalize`
- `/api/feed/list|ack`
- `/api/analytics/query|summary|export`
- `/api/telemetry`

Most endpoints support query controls:

- `delay=<ms>`
- `status=<httpStatus>`
- `mode=timeout` (intentionally unresolved response)

## Manual Test Matrix

1. Baseline timing
   - Fast response under `showDelayMs` should avoid visible skeleton.
   - Medium/slow responses should show skeleton and hide after completion.
2. Reliability
   - Force non-2xx status and confirm skeleton clears.
   - In `abort` mode, timeout scenario should reject request and clear skeleton.
   - In `synthetic` mode, timeout should clear UI tracking without duplicate terminal behavior.
3. Concurrency
   - Dashboard load should keep overlay until all four cards finish.
   - Table bulk refresh should keep overlay until final detail request resolves.
4. Lifecycle
   - `Stop enhancer` should disable skeleton behavior while requests still resolve.
   - `Destroy enhancer` then `Restart enhancer` should re-create cleanly.
5. Routing
   - Switching routes should clean previous overlay and handlers.
   - Browser back/forward between hash routes should remount correct demo.
6. Side-by-side comparison checks
   - For the same action code (e.g. `OVR-FAST-10`), verify both sides receive matching data.
   - Confirm skeleton visibility appears only on the left (with package) side.
   - Confirm right side has no overlay artifacts but still completes requests.
7. Skeleton quality checks
   - Try all overview presets and verify animation/style changes are visible immediately.
   - In adaptive modes, verify placeholders reflect child element structure (lines/blocks).
   - Verify reduced-motion setting disables shimmer/pulse style movement.

## npm Publish Note

`playground/` remains excluded from npm package contents via root `package.json` `files` allowlist.
