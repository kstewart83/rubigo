---
description: Sync, validate, merge WIP into main, and cleanup
---

# WIP Merge

Merge a WIP branch into main with validation and cleanup.

## Prerequisites

- Active WIP worktree at `../wip/<slug>/`
- PR exists on GitHub (created via `/wip-commit`)
- Changes pushed to remote

## Step 1: Get Context

From the WIP worktree, read `wip.toml`:
- `worktree.branch` - Branch name
- `worktree.slug` - Worktree slug
- `pr_number` - GitHub PR number
- `worktree.type` - Change type (feature/bugfix/chore)

Get repo info:
```bash
git remote get-url origin
```

## Step 2: Sync with Main

```bash
git fetch origin
git rebase origin/main
```

If conflicts occur, resolve and continue:
```bash
git rebase --continue
```

## Step 3: Run Validation

> [!IMPORTANT]
> This step is **REQUIRED** before merging.

```bash
cd rubigo-react
bun run pre-push-check
```

## Step 4: Version Bump

> [!IMPORTANT]
> Version bump is required for `feature/` and `bugfix/` branches.
> Version bump is optional for `chore/` branches.

Read version from `rubigo-react/rubigo.toml` and bump according to change type:

| Change Type | Bump (Pre-1.0) | Bump (Post-1.0) |
|-------------|----------------|-----------------|
| Breaking changes | Minor | Major |
| New features | Minor | Minor |
| Bug fixes, deps | Patch | Patch |
| Chores | None (optional) | None (optional) |

If version bump is needed:
```bash
# Edit rubigo-react/rubigo.toml
git add rubigo-react/rubigo.toml
git commit --amend --no-edit
```

## Step 5: Push Changes

```bash
git push --force-with-lease
```

## Step 6: Mark PR Ready and Merge

```bash
gh pr ready <pr_number>
gh pr merge <pr_number> --squash --delete-branch
```

## Step 7: Cleanup

From the main repo checkout (not the worktree):
```bash
# Remove the worktree
git worktree remove ../wip/<slug> --force

# Clean up any remaining files
rm -rf ../wip/<slug>

# Delete local branch (if exists)
git branch -D <branch> 2>/dev/null || true

# Prune stale refs
git fetch --prune
```

## Step 8: Sync Main

```bash
git checkout main
git pull
```

## Related Workflows

| Workflow | Purpose |
|----------|---------|
| `/wip-preflight` | Local validation before merge |
| `/wip-stage` | Remote staging validation |
| `/wip-deploy` | Full pipeline: preflight → stage → merge → monitor |

## Notes

- Merge triggers automatic production deployment
- `--force-with-lease` fails if someone pushed since last fetch
- GitHub auto-deletes remote branch on merge
