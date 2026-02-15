# Contributing to @kerothebosa/ui-skeleton-net

Thanks for contributing.

## Start Here

1. Install dependencies:
   - `npm ci`
2. Run quality checks before opening a PR:
   - `npm run ci`

## Development Workflow

1. Build package output:
   - `npm run build`
2. Run local demo:
   - `npm run demo:dev`
3. Run docs locally:
   - `npm run docs:dev`

## Pull Requests

- Keep changes focused and scoped.
- Add or update tests for behavior changes.
- Update docs when API, lifecycle, docs site, or demo behavior changes.
- Fill out `.github/PULL_REQUEST_TEMPLATE.md`.

## Release Notes and Changelog

- Update `CHANGELOG.md` in the `Unreleased` section for user-facing changes.
- Use semantic version tags (`vX.Y.Z`) for releases.

## Maintainer Docs

Deep maintainer docs are under `docs/internal/`:

- Architecture: `docs/internal/architecture.md`
- Lifecycle and events: `docs/internal/lifecycle-and-events.md`
- Interceptors: `docs/internal/interceptors.md`
- Testing strategy: `docs/internal/testing.md`
- Playground internals: `docs/internal/playground.md`
- Real-world validation: `docs/internal/real-world-testing.md`
- Release checklist: `docs/internal/release-checklist.md`
