# Contributing to Rubigo

Guidelines for contributing to the Rubigo ERM Platform.

## Semantic Versioning

We follow [Semantic Versioning](https://semver.org/). While at `0.x.x`, breaking changes bump minor.

| Change Type | Version Bump | Examples |
|-------------|--------------|----------|
| Bug fixes, refactoring, docs, deps | **Patch** (0.1.x) | Fix typo, update dependency |
| New features (backward compatible) | **Minor** (0.x.0) | Add module, new API endpoint |
| Breaking changes | **Major** (x.0.0) | UI overhaul, API breaking changes |

### Version Location
- Update version in `rubigo.toml`

## Pre-Push Checklist

Before pushing to `main`, ensure:

- [ ] **No local paths** - No `/Users/...`, `/home/...`, `C:\...`
- [ ] **No secrets** - No API keys, passwords, tokens
- [ ] **No sensitive info** - No PII, internal URLs, credentials
- [ ] **No large files** - No files > 1MB without approval

Run the check script:
```bash
./scripts/pre-push-check.sh
```

## Code Style

- Use TypeScript strict mode
- Run `bun run lint` before committing
- Run `bun test` to ensure tests pass

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat(module):` - New feature
- `fix(module):` - Bug fix
- `docs:` - Documentation only
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks
