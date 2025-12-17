---
description: Enforce conventional commit message format
trigger: always_on
---

# Conventional Commits

All commits must follow the Conventional Commits specification.

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

## Types

| Type | Description | Version Impact |
|------|-------------|----------------|
| `feat` | New feature | Minor |
| `fix` | Bug fix | Patch |
| `docs` | Documentation only | Patch |
| `chore` | Maintenance, deps | Patch |
| `refactor` | Code refactoring | Patch |

## Examples

```
feat(calendar): add recurring event support
fix(sidebar): resolve collapse animation flicker
docs(readme): update installation steps
chore(deps): upgrade drizzle-orm to 0.38.0
refactor(api): extract common validation logic
```

## Breaking Changes

Add `BREAKING CHANGE:` in the footer:

```
feat(api): change response format

BREAKING CHANGE: API responses now use camelCase keys
```
