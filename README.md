# @skeleton-ui/net

Framework-agnostic TypeScript library scaffold for enhancing network-driven UIs with skeleton loaders.

Full project docs live in `docs/README.md`.
For real app validation, use `docs/real-world-testing.md`.

## Status

This repository is a production-ready template scaffold:

- Dual output (`ESM` + `CJS`) with generated `.d.ts` files
- Strict TypeScript + ESLint + Prettier setup
- Jest unit tests and Playwright E2E fixtures
- GitHub Actions for CI and npm publishing

Core skeleton behavior is intentionally minimal so implementation can evolve safely.

## Installation

```bash
npm install @skeleton-ui/net
```

## Styling

This package ships default overlay styles, but you must import them explicitly:

```ts
import "@skeleton-ui/net/styles.css";
```

## Quick Usage

```ts
import { SkeletonEnhancer } from "@skeleton-ui/net";
import "@skeleton-ui/net/styles.css";

const enhancer = new SkeletonEnhancer({
  skeletonSelector: "#content",
  overlayClassName: "sknet-skeleton-overlay",
  timeoutMode: "abort",
  showDelayMs: 120,
  minVisibleMs: 180,
  requestTimeoutMs: 15_000,
  hooks: {
    onRequestStart: ({ url }) => console.log("request:start", url),
    onRequestEnd: ({ url, status }) => console.log("request:end", url, status)
  }
});

enhancer.start();
```

## API Snapshot

```ts
type SkeletonEnhancerOptions = {
  skeletonSelector?: string;
  skeletonClassName?: string;
  overlayClassName?: string;
  requestTimeoutMs?: number;
  timeoutMode?: "abort" | "synthetic";
  showDelayMs?: number;
  minVisibleMs?: number;
  enabledInterceptors?: Array<"fetch" | "xhr">;
  shouldHandleRequest?: (ctx: {
    url: string;
    method: string;
    source: "fetch" | "xhr" | string;
  }) => boolean;
  debug?: boolean;
  hooks?: SkeletonEnhancerHooks;
};

class SkeletonEnhancer {
  start(): void;
  stop(): void;
  destroy(): void;
  on(event, handler): SkeletonEnhancer;
  off(event, handler): SkeletonEnhancer;
  registerInterceptor(interceptor): SkeletonEnhancer;
  unregisterInterceptor(name: string): SkeletonEnhancer;
  isRunning(): boolean;
}
```

## Browser / Runtime Support

- Node.js `>=18` for tooling and tests
- Modern browsers with `fetch` and `XMLHttpRequest` support
- Styling is not zero-config: import `@skeleton-ui/net/styles.css`

## Scripts

| Script                | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| `npm run build`       | Build `dist/` as ESM + CJS + declaration files |
| `npm run build:watch` | Build in watch mode                            |
| `npm run lint`        | Run ESLint with zero warnings                  |
| `npm run typecheck`   | Run strict TypeScript checks                   |
| `npm run test`        | Run Jest unit tests with coverage              |
| `npm run test:e2e`    | Build and run Playwright E2E tests             |
| `npm run test:all`    | Run unit + E2E test suites                     |
| `npm run ci`          | Full local CI sequence                         |

## Testing

Unit tests:

```bash
npm run test
```

E2E tests:

```bash
npm run test:e2e
```

## Publishing

1. Update version in `package.json`.
2. Commit and push to `main`.
3. Create and push a semantic version tag:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
4. GitHub Actions publishes to npm using `NPM_TOKEN`.

## Contributing

1. Install dependencies with `npm ci`.
2. Run `npm run ci` before opening a PR.
3. Keep public API additions typed and documented in this README.
