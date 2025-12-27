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

## Step 4: Validate Version Bump

> [!IMPORTANT]
> Version bump is required for `feature/` and `bugfix/` branches.
> Version bump is optional for `chore/` branches.

Run the validation script:
```bash
cd rubigo-react
bun run scripts/validate-version-bump.ts
```

If validation fails, bump the version in `rubigo-react/rubigo.toml`:
- **Patch** (bug fix): increment third number (0.20.0 → 0.20.1)
- **Minor** (new feature): increment second number, reset patch (0.20.0 → 0.21.0)

Then amend your commit:
```bash
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

## Step 7: Sync Main

```bash
git checkout main
git pull
```

> [!NOTE]
> Cleanup (worktree removal) is handled by `/wip-deploy` after monitoring succeeds.
> If running `/wip-merge` standalone, manually run cleanup from main checkout.

## Related Workflows

| Workflow | Purpose |
|----------|---------|
| `/wip-preflight` | Local validation before merge |
| `/wip-stage` | Remote staging validation |
| `/wip-deploy` | Full pipeline: preflight → stage → merge → monitor → cleanup |

## Notes

- Merge triggers automatic production deployment
- `--force-with-lease` fails if someone pushed since last fetch
- GitHub auto-deletes remote branch on merge
