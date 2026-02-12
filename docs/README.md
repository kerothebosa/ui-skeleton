# Documentation Index

This folder contains implementation-focused documentation for `@skeleton-ui/net`.
Published documentation site is generated from these files via `site/`:
`https://kerothebosa.github.io/ui-skeleton/`.

## Read In This Order

1. `architecture.md`
2. `lifecycle-and-events.md`
3. `api-reference.md`
4. `interceptors.md`
5. `testing.md`
6. `playground.md`
7. `real-world-testing.md`
8. `contributing.md`

## Quick Links

- Architecture overview: `docs/architecture.md`
- Public API reference: `docs/api-reference.md`
- Lifecycle and event semantics: `docs/lifecycle-and-events.md`
- Interceptor internals: `docs/interceptors.md`
- Test strategy and fixture routes: `docs/testing.md`
- Playground architecture and config workflow: `docs/playground.md`
- Real application validation: `docs/real-world-testing.md`
- Contributor workflow: `docs/contributing.md`

## Production Release Checklist

1. Run `npm run ci`.
2. Run `npm run pack:check`.
3. Run `npm run docs:build`.
4. Confirm repository metadata and docs links are correct.
5. Bump package version and push a `vX.Y.Z` tag.
