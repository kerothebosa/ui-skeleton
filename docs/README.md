# Documentation Index

This folder contains implementation-focused documentation for `@skeleton-ui/net`.

## Read In This Order

1. `architecture.md`
2. `lifecycle-and-events.md`
3. `api-reference.md`
4. `interceptors.md`
5. `testing.md`
6. `real-world-testing.md`
7. `contributing.md`

## Quick Links

- Architecture overview: `docs/architecture.md`
- Public API reference: `docs/api-reference.md`
- Lifecycle and event semantics: `docs/lifecycle-and-events.md`
- Interceptor internals: `docs/interceptors.md`
- Test strategy and fixture routes: `docs/testing.md`
- Real application validation: `docs/real-world-testing.md`
- Contributor workflow: `docs/contributing.md`

## Production Release Checklist

1. Run `npm run ci`.
2. Run `npm run pack:check`.
3. Confirm repository metadata and docs links are correct.
4. Bump package version and push a `vX.Y.Z` tag.
