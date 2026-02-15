# Testing Guide

## Test Layers

- Unit tests (`tests/unit`)
  - lifecycle correctness
  - event bus semantics
  - interceptor behavior and error paths
  - timing controls (`showDelayMs`, `minVisibleMs`, `requestTimeoutMs`)
  - timeout policy behavior (`timeoutMode: "abort" | "synthetic"`)
- E2E tests (`tests/e2e`)
  - fixture-driven behavior in a browser with Playwright
  - style import validation from packaged CSS

## Fixture Server

- Entry: `tests/fixtures/server.mjs`
- Default URL: `http://127.0.0.1:4173`
- Routes:
  - `/health`
  - `/api/data?delay=<ms>`
  - `/api/error?delay=<ms>`
  - `/api/never` (intentionally unresolved for timeout scenarios)
  - `/basic/`
  - `/delayed-api/`

## Local Commands

- Unit: `npm run test`
- E2E: `npm run test:e2e`
- Playground smoke: `npm run playground`
- Full pipeline: `npm run ci`
- Pack validation: `npm run pack:check`

## Timeout Expectations

- `timeoutMode: "abort"`:
  - enhancer attempts to cancel the active request
  - terminal event should surface `aborted: true` where applicable
- `timeoutMode: "synthetic"`:
  - enhancer stops UI tracking without aborting the underlying request
  - late network completion must not emit duplicate consumer terminal handling

## Coverage Policy

Jest enforces minimum global thresholds:

- statements: `80`
- branches: `70`
- functions: `80`
- lines: `80`

## Regression Cases To Keep

- `skeleton:show` must always correspond to a rendered skeleton node.
- Adaptive mode must tolerate empty/malformed `ignoreSelectors`.
- When adaptive rendering cannot derive placeholders, overlay fallback must still render.
