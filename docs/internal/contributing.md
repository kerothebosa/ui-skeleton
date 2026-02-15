# Contributing

Canonical contributor guidance is in `../../CONTRIBUTING.md`.

This internal document is maintainer-focused and links to deeper implementation docs.

## Internal Documentation Map

- Architecture: `architecture.md`
- Lifecycle and events: `lifecycle-and-events.md`
- Interceptors: `interceptors.md`
- Testing strategy and fixtures: `testing.md`
- Playground architecture/config workflow: `playground.md`
- Real-world validation workflow: `real-world-testing.md`
- Release process checklist: `release-checklist.md`

## Publish Gate Policy

Publish workflow validates all gates before npm publish:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run pack:check`
