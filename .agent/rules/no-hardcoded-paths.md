---
description: Reject local or absolute paths in code
trigger: always_on
---

# No Hardcoded Paths

Code must not contain local filesystem paths or hardcoded URLs.

## Blocked Patterns

- `/Users/` - macOS home directories
- `/home/` - Linux home directories  
- `C:\Users\` - Windows paths
- `localhost:` - Hardcoded dev URLs (except in e2e/test files)
- `127.0.0.1:` - Loopback addresses

## Allowed

- Relative paths (`./`, `../`)
- Environment variables (`process.env.DATABASE_URL`)
- Configuration files
- Test fixtures

## Pre-commit Check

The `pre-push-check` script validates for these patterns before commits.
