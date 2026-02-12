# Contributing to @skeleton-ui/net

Thanks for contributing.

## Start Here

1. Read the implementation contributor guide: `docs/contributing.md`
2. Install dependencies:
   - `npm ci`
3. Run quality checks before opening a PR:
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
- Update docs when API, lifecycle, or demo behavior changes.
- Fill out `.github/PULL_REQUEST_TEMPLATE.md`.

## Release Notes and Changelog

- Update `CHANGELOG.md` in the `Unreleased` section for user-facing changes.
- Use semantic version tags (`vX.Y.Z`) for releases.
