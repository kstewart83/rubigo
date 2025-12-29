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
- Statement breakpoint format (`--> statement-breakpoint` with space)
- No duplicate migration numbers
- Journal consistency (all referenced migrations exist)
- Sequential numbering
- **Timestamp ordering (CRITICAL)** - see below
- Destructive operations (DROP TABLE, DELETE FROM, etc.)

> [!CAUTION]
> **Migration Timestamp Ordering**: Drizzle-orm determines pending migrations by comparing the journal `when` timestamp against the last applied migration's `created_at`. If a new migration has a timestamp **older than** the last applied migration, drizzle will **silently skip it**.
>
> **Fix**: Ensure new migration entries in `drizzle/meta/_journal.json` have `when` values greater than ALL previous entries.


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

## Step 5: Check Rebase Status

Verify the branch is rebased on latest main:

```bash
git fetch origin
git merge-base --is-ancestor origin/main HEAD
```

If the command fails (exit code 1), the branch is not rebased on main. Run:
```bash
git rebase origin/main
git push --force-with-lease
```

## Step 6: User Approval Gate

> [!CAUTION]
> Before updating wip.toml, **the agent MUST use notify_user** to report:
> - Summary of all checks run
> - Any warnings encountered
> - Ask user to confirm preflight is complete
>
> Do NOT auto-approve preflight. Wait for user confirmation.

## Step 7: Update wip.toml

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
