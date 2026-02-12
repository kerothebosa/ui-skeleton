# Pre-Publication Checklist

Use this checklist before making the repository public or publishing a new release.

## 1) Metadata and Package Surface

- [ ] `package.json` fields are correct (`name`, `version`, `description`, `license`, `repository`, `homepage`, `bugs`, `exports`, `types`, `files`, `engines`)
- [ ] `LICENSE` exists and matches `package.json`
- [ ] `README.md` links resolve and match current behavior
- [ ] `CHANGELOG.md` includes release notes for user-facing changes

## 2) Build and Test Gates

- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run test:e2e`
- [ ] `npm run pack:check`
- [ ] `npm run docs:build`
- [ ] `npm run demo:build`

## 3) Pack and Consumer Smoke

- [ ] `npm pack` creates expected tarball
- [ ] Install tarball in a clean test app and verify:
- [ ] `import { SkeletonEnhancer } from "@skeleton-ui/net"` works
- [ ] `import "@skeleton-ui/net/styles.css"` resolves
- [ ] Runtime behavior matches docs examples

## 4) Docs and Demo Validation

- [ ] Local docs preview works (`npm run docs:preview`)
- [ ] Local demo preview works (`npm run demo:preview`)
- [ ] Demo routes load and switch correctly:
- [ ] `#/overview`, `#/dashboard`, `#/forms`, `#/table`, `#/search`, `#/workflow`, `#/feed`, `#/analytics`
- [ ] Config URL/file import-export flows still work
- [ ] Internal docs links and README links are not broken

## 5) Security and Secrets

- [ ] No credentials, tokens, or `.env` content committed
- [ ] Run a quick secret scan:
  - `rg -n --hidden --glob \"!node_modules\" --glob \"!.git\" \"(ghp_|github_pat_|npm_[A-Za-z0-9]|NPM_TOKEN|API_KEY|SECRET|PASSWORD)\" .`
- [ ] Verify `.gitignore` excludes local/generated artifacts
- [ ] `SECURITY.md` contact details are valid

## 6) Release Automation Readiness

- [ ] GitHub Actions green on `main` (`ci.yml`)
- [ ] Pages workflow deploys docs+demo (`pages.yml`)
- [ ] npm publish workflow requires tag (`publish.yml`, `vX.Y.Z`)
- [ ] `NPM_TOKEN` is configured in repository secrets
- [ ] npm account has 2FA enabled for publish
- [ ] provenance publish remains enabled (`publishConfig.provenance`)

## 7) Final Release Steps

- [ ] Bump version
- [ ] Update `CHANGELOG.md`
- [ ] Merge to `main`
- [ ] Tag and push release:
  - `git tag vX.Y.Z`
  - `git push origin vX.Y.Z`
