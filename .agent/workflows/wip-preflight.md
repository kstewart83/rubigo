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

> [!IMPORTANT]
> If warnings are found, **STOP and show the warnings to the user**. Do NOT proceed without explicit user approval. Ask: "Preflight found N warning(s). Review the warnings above and confirm if they are acceptable."

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

## Step 5: User Approval Gate

> [!CAUTION]
> Before updating wip.toml, **the agent MUST use notify_user** to report:
> - Summary of all checks run
> - Any warnings encountered
> - Ask user to confirm preflight is complete
>
> Do NOT auto-approve preflight. Wait for user confirmation.

## Step 6: Update wip.toml

Only after user confirms, update `wip.toml`:

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
- **Warnings always require user review**
