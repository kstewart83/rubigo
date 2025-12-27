---
description: Run local preflight checks before staging
---

# WIP Preflight

Quick local validation checks before triggering remote staging. This is a fast, local-only workflow.

## Prerequisites

- Active WIP worktree at `../wip/<slug>/`
- Changes committed and pushed

## Step 1: Run Pre-Push Check

```bash
cd rubigo-react
bun run pre-push-check
```

This runs linting, type checking, and formatting validation.

## Step 2: Validate Migrations

```bash
bun run production/validate-migrations.ts rubigo-react
```

Checks:
- Statement breakpoint format
- No duplicate migration numbers
- Journal consistency
- Sequential numbering

## Step 3: Check for Uncommitted Changes

```bash
git status --porcelain
```

If there are uncommitted changes, commit or stash them before proceeding.

## Step 4: Verify Branch is Pushed

```bash
git log origin/<branch>..HEAD
```

If there are unpushed commits, push them first.

## Step 5: Update wip.toml

If all checks pass, update `wip.toml`:

```toml
[preflight]
passed = true
commit = "<current HEAD commit hash>"
timestamp = "<ISO 8601 timestamp>"
```

## Next Steps

If preflight passes:
- Run `/wip-stage` for remote staging validation

If preflight fails:
- Fix issues
- Commit changes
- Re-run `/wip-preflight`

## Related Workflows

| Workflow | Purpose |
|----------|---------|
| `/wip-commit` | Commit and push changes |
| `/wip-stage` | Remote staging validation (after preflight) |
| `/wip-deploy` | Deploy after staging passes |

## Notes

- Preflight is fast (runs locally)
- Staging is thorough (runs on runner with production db copy)
- Both must pass before deploy
