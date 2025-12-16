---
description: How to publish changes to the Rubigo platform
---

# Publishing Changes

Follow these steps when publishing changes to the Rubigo platform.

## Step 1: Pre-Publish Validation

Check for non-production elements that should not be committed:

### Secrets and Credentials
```bash
# Search for potential secrets
grep -rE "(password|secret|api_key|token)\s*[:=]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" | grep -v node_modules | grep -v ".lock"
```

Look for:
- Hardcoded passwords or API keys
- Real credentials in config files
- `.env` files (should be gitignored)

### Test/Debug Code
```bash
# Search for common debug patterns
grep -rE "(console\.log|debugger|\.only\(|\.skip\(|TODO|FIXME|XXX)" --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Review and remove:
- `console.log` statements (unless intentional logging)
- `debugger` statements
- `.only()` or `.skip()` in tests
- Unresolved TODOs/FIXMEs that should be addressed

### Non-Production Patterns
```bash
# Check for localhost or hardcoded URLs
grep -rE "(localhost|127\.0\.0\.1|http://|https://.*\.(dev|test|local))" --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v e2e
```

### Large Files
```bash
# Find files over 1MB
find . -type f -size +1M -not -path "./node_modules/*" -not -path "./.git/*"
```

> [!CAUTION]
> Any findings from the above checks should be addressed before publishing.

## Step 2: Run Pre-Push Script

// turbo
```bash
./scripts/pre-push-check.sh
```

## Step 3: Determine Version Bump

Use **UI-adapted Semantic Versioning**:

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Breaking UI changes (E2E tests modified) | **Major** | `1.0.0` → `2.0.0` |
| New features, backwards-compatible changes | **Minor** | `1.0.0` → `1.1.0` |
| Dependency updates, docs, bug fixes | **Patch** | `1.0.0` → `1.0.1` |

### Pre-1.0.0 Rules

While version is `0.x.x`:
- What would be a **major** bump becomes a **minor** bump
- Minor and patch bumps work as normal

| Change Type (Pre-1.0) | Version Bump | Example |
|-----------------------|--------------|---------|
| Breaking UI changes | **Minor** | `0.3.0` → `0.4.0` |
| New features | **Minor** | `0.3.0` → `0.4.0` |
| Deps, docs, fixes | **Patch** | `0.3.0` → `0.3.1` |

### How to Detect Breaking Changes

A change is **breaking** if:
- Existing E2E tests had to be modified to pass (not just new tests added)
- Existing user workflows no longer work the same way
- API contracts changed in incompatible ways

Update the version in `rubigo-react/rubigo.toml`:
```toml
[package]
version = "x.y.z"
```

## Step 4: Build Verification

// turbo
```bash
bun --bun run build
```

## Step 5: Run Tests

// turbo
```bash
bun test
```

## Step 6: Commit and Push

Stage and commit with a conventional commit message:
```bash
git add -A
git commit -m "<type>(<scope>): <description>"
```

Commit types:
- `feat` - New feature (minor bump)
- `fix` - Bug fix (patch bump)
- `docs` - Documentation (patch bump)
- `chore` - Maintenance, deps (patch bump)
- `refactor` - Code refactoring (patch bump)
- `BREAKING CHANGE` - In commit body for breaking changes (major bump)

Push to main:
```bash
git push
```
