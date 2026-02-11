# Contributing

## Workflow

1. Install dependencies:
   - `npm ci`
2. Run quality gates before PR:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`
   - `npm run test:e2e`
3. Keep public API updates documented in:
   - `README.md`
   - `docs/api-reference.md`

## Engineering Expectations

- Preserve additive API compatibility when possible.
- Add tests for every behavior change and edge case.
- Keep request lifecycle and cleanup deterministic.
- Prefer typed interfaces and avoid untyped event payloads.

## Release Hygiene

- Bump version in `package.json`.
- Tag using semantic format (`vX.Y.Z`).
- Push tag to trigger publish workflow.

## Publish Gate Policy

Publish workflow executes full validation before npm publish:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run pack:check`

If any step fails, publish is blocked.
