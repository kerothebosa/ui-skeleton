# Contributing

This repository accepts public contributions for `@skeleton-ui/net`.

## Local Workflow

1. Install dependencies:
   - `npm ci`
2. Run quality gates before opening a PR:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`
   - `npm run test:e2e`
3. Keep public API updates documented in:
   - `README.md`
   - `docs/api-reference.md`

## Pull Request Expectations

- Preserve additive API compatibility when possible.
- Add tests for every behavior change and edge case.
- Keep request lifecycle and cleanup deterministic.
- Prefer typed interfaces and avoid untyped event payloads.

## Maintainer Docs

Deep maintainer and release docs live in `docs/internal/`:

- Architecture: `docs/internal/architecture.md`
- Lifecycle and events: `docs/internal/lifecycle-and-events.md`
- Interceptors: `docs/internal/interceptors.md`
- Testing strategy: `docs/internal/testing.md`
- Playground internals: `docs/internal/playground.md`
- Real-world validation: `docs/internal/real-world-testing.md`
- Release process: `docs/internal/release-checklist.md`
