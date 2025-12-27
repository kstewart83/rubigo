---
description: Sync, validate, merge WIP into main, and cleanup
---

# WIP Merge

Complete a WIP branch by rebasing, validating, merging, and cleaning up.

## Prerequisites

- Active WIP worktree at `../wip/<slug>/`
- At least one commit pushed to the branch
- PR exists on GitHub (created via `/wip-commit`)

## Step 1: Get Context

From the WIP worktree, read `wip.toml`:
- `worktree.branch` - Branch name
- `worktree.slug` - Worktree slug
- `pr_number` - GitHub PR number

Get repo info:
```bash
git remote get-url origin
```

## Step 2: Sync with Main

From the WIP worktree:
```bash
git fetch origin
git rebase origin/main
```

If conflicts occur, resolve them and continue:
```bash
git rebase --continue
```

## Step 3: Run Validation

> [!IMPORTANT]
> This step is **REQUIRED** before pushing. Do not skip.

Read validation command from `wip.toml` for the relevant project(s):

```bash
# Example for rubigo-react
cd rubigo-react
bun run pre-push-check
```

This checks for:
- **Errors (must fix)**: Local paths, secrets, `.only()` patterns
- **Warnings (review)**: Debug statements, localhost URLs, large files

If errors are found, fix them before proceeding.

## Step 4: Check Database Migrations

If `src/db/schema.ts` was modified, generate migrations:

```bash
bun run db:generate
```

If new migration files were created, commit them:
```bash
git add drizzle/
git commit -m "feat(db): add migration for schema changes"
```

## Step 5: Run Tests

Read test command from `wip.toml`:

```bash
# Example for rubigo-react
bun run test:e2e:full
```

## Step 6: Version Bump (if applicable)

Read version file from `wip.toml` and bump according to change type:

| Change Type | Bump (Pre-1.0) | Bump (Post-1.0) |
|-------------|----------------|-----------------|
| Breaking changes | Minor | Major |
| New features | Minor | Minor |
| Bug fixes, deps | Patch | Patch |

Commit the version bump:
```bash
git add <version_file>
git commit --amend --no-edit
```

## Step 7: Push Changes

Push the rebased branch:
```bash
git push --force-with-lease
```

## Step 8: Mark PR Ready

```
mcp_github-mcp-server_update_pull_request
  owner: <owner>
  repo: <repo>
  pullNumber: <pr_number>
  draft: false
```

## Step 9: Merge PR

```
mcp_github-mcp-server_merge_pull_request
  owner: <owner>
  repo: <repo>
  pullNumber: <pr_number>
  merge_method: squash
```

## Step 10: Cleanup

From the main repo checkout (not the worktree):
```bash
# Remove the worktree
git worktree remove ../wip/<slug>

# Delete local branch
git branch -D <branch>

# Delete remote branch (if not auto-deleted)
git push origin --delete <branch>

# Prune stale remote tracking refs
git fetch --prune
```

## Step 11: Sync Main

Update the main checkout with merged changes:
```bash
git checkout main
git pull
```

## Checklist Summary

Before merging, ensure:
- [ ] Rebased on latest `origin/main`
- [ ] Pre-push validation passed (no errors)
- [ ] Database migrations generated (if schema changed)
- [ ] Tests passed
- [ ] Version bumped (if applicable)
- [ ] Commit message follows conventional format

## Notes

- `--force-with-lease` fails if someone else pushed since your last fetch
- GitHub may auto-delete the remote branch on merge
- If merge fails due to checks, wait for CI and retry
