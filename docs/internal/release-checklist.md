# Release Checklist

Maintainer checklist for publishing `@skeleton-ui/net`.

## Pre-Release Validation

1. Run full validation:
   - `npm run ci`
2. Validate package contents:
   - `npm run pack:check`
3. Confirm repository metadata and docs links are correct.
4. Confirm `README.md` and `docs/api-reference.md` match current public API.

## Versioning And Publish Trigger

1. Bump version in `package.json`.
2. Commit and push to `main`.
3. Create and push a semantic version tag:
   - `git tag vX.Y.Z`
   - `git push origin vX.Y.Z`

## Publish Workflow Notes

- Tag push triggers `.github/workflows/publish.yml`.
- Publish job executes:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run test:e2e`
  - `npm run pack:check`
  - `npm publish --provenance --access public`
- If any validation step fails, publish is blocked.
