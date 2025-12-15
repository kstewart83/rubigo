---
description: How to publish changes to the Rubigo platform
---

# Publishing Changes

Follow these steps when publishing changes to the Rubigo platform.

## Pre-Push Validation

// turbo
1. Run the pre-push check script:
```bash
./scripts/pre-push-check.sh
```

2. Ensure no errors are reported. If errors are found:
   - Fix any local path references
   - Remove any secrets or sensitive information
   - Get approval for any large files (> 1MB)

## Version Bumping

Update `rubigo.toml` based on the type of change:

| Change Type | Action |
|-------------|--------|
| Bug fixes, refactoring, docs | Bump **patch**: `0.1.0` → `0.1.1` |
| New features (backward compatible) | Bump **minor**: `0.1.0` → `0.2.0` |
| Breaking changes (UI overhaul, API) | Bump **major**: `0.x.x` → `1.0.0` |

> **Note:** While at `0.x.x`, breaking changes may bump minor instead.

## Build Verification

// turbo
3. Run build to verify no TypeScript errors:
```bash
bun --bun run build
```

// turbo
4. Run tests:
```bash
bun test
```

## Commit and Push

5. Stage and commit changes with a conventional commit message:
```bash
git add -A
git commit -m "feat(module): description of change"
```

6. Push to main:
```bash
git push
```
