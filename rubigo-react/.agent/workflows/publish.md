---
description: How to publish changes to the Rubigo platform
---

# Publishing Changes

Follow these steps when publishing changes to the Rubigo platform.

## Step 1: Run Pre-Publish Validation

// turbo
Run the validation script from `rubigo-react/`:
```
bun run pre-push-check
```

This checks for:
- Local/absolute paths (`/Users/`, `/home/`, etc.)
- Potential secrets (api_key, password, auth_token, etc.)
- Debug statements (`console.log`, `debugger`)
- Test-only patterns (`.only()`, `.skip()`)
- Localhost/hardcoded dev URLs
- Large files (>1MB)
- `.env` files that shouldn't be committed

> [!CAUTION]
> - **Errors**: Must be fixed before proceeding
> - **Warnings**: Require explicit user approval to continue

## Step 2: Determine Version Bump

Use **UI-adapted Semantic Versioning**. Update `rubigo-react/rubigo.toml`:

```toml
[package]
version = "x.y.z"
```

### Version Rules (Post-1.0)

| Change Type | Bump | Example |
|-------------|------|---------|
| Breaking UI changes (E2E tests had to be modified) | **Major** | `1.0.0` → `2.0.0` |
| New features, backwards-compatible changes | **Minor** | `1.0.0` → `1.1.0` |
| Dependency updates, docs, bug fixes | **Patch** | `1.0.0` → `1.0.1` |

### Pre-1.0.0 Rules

| Change Type | Bump | Example |
|-------------|------|---------|
| Breaking UI changes | **Minor** | `0.3.0` → `0.4.0` |
| New features | **Minor** | `0.3.0` → `0.4.0` |
| Deps, docs, fixes | **Patch** | `0.3.0` → `0.3.1` |

> [!TIP]
> A change is **breaking** if existing E2E tests had to be modified to pass (not just new tests added).

## Step 3: Build Verification

// turbo
```
bun run build
```

## Step 4: Run Tests

// turbo
```
bun test
```

## Step 5: Commit and Push

Commit with a conventional commit message:
```
git add -A
git commit -m "<type>(<scope>): <description>"
```

| Type | Use For | Version Impact |
|------|---------|----------------|
| `feat` | New feature | Minor |
| `fix` | Bug fix | Patch |
| `docs` | Documentation | Patch |
| `chore` | Maintenance, deps | Patch |
| `refactor` | Code refactoring | Patch |

For breaking changes, add `BREAKING CHANGE:` in the commit body.

Push:
```
git push
```
