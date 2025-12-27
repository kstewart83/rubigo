---
description: Deploy staged WIP branch to production
---

# WIP Deploy

Deploy a staged WIP branch to production after successful staging validation.

## Prerequisites

- Active WIP worktree at `../wip/<slug>/`
- PR exists on GitHub (created via `/wip-commit`)
- **Staging passed** (`/wip-stage` completed successfully)
- `[staging]` section exists in `wip.toml` with `passed = true`

## Step 1: Verify Staging Report

> [!IMPORTANT]
> Do NOT proceed if staging has not passed.

Read `wip.toml` and verify:
1. `[staging]` section exists
2. `staging.passed = true`
3. `staging.commit` matches current HEAD

If staging commit doesn't match current HEAD:
```bash
echo "⚠️ Code has changed since staging. Re-run /wip-stage first."
```

## Step 2: Get Context

From the WIP worktree, read `wip.toml`:
- `worktree.branch` - Branch name
- `worktree.slug` - Worktree slug
- `pr_number` - GitHub PR number
- `staging.workflow_run_id` - Staging run for reference

Get repo info:
```bash
git remote get-url origin
```

## Step 3: Version Bump

> [!IMPORTANT]
> Version must be bumped before merging.

Read version from `rubigo.toml` and bump according to change type:

| Change Type | Bump (Pre-1.0) | Bump (Post-1.0) |
|-------------|----------------|-----------------|
| Breaking changes | Minor | Major |
| New features | Minor | Minor |
| Bug fixes, deps | Patch | Patch |

Commit the version bump:
```bash
git add rubigo.toml
git commit -m "chore: bump version to <new_version>"
git push
```

## Step 4: Mark PR Ready

```
mcp_github-mcp-server_update_pull_request
  owner: <owner>
  repo: <repo>
  pullNumber: <pr_number>
  draft: false
```

## Step 5: Merge PR

```
mcp_github-mcp-server_merge_pull_request
  owner: <owner>
  repo: <repo>
  pullNumber: <pr_number>
  merge_method: squash
```

This triggers the `deploy-react.yml` workflow automatically.

## Step 6: Monitor Deployment

Watch the deployment workflow:

```bash
gh run watch
```

Verify health check passes.

## Step 7: Cleanup

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

## Step 8: Sync Main

Update the main checkout with merged changes:
```bash
git checkout main
git pull
```

## Step 9: Post Implementation Review

Prompt user to run `/pir` for post-implementation review.

## Checklist Summary

Before deploying, ensure:
- [ ] Staging passed (check `wip.toml`)
- [ ] Staging commit matches current HEAD
- [ ] Version bumped
- [ ] Commit message follows conventional format

## Related Workflows

| Workflow | Purpose |
|----------|---------|
| `/wip-stage` | Must be run first to validate changes |
| `/pir` | Run after successful deploy |
| `/wip-delete` | Abandon work instead of deploying |

## Notes

- Merge triggers automatic production deployment
- GitHub may auto-delete the remote branch on merge
- If deployment fails, check GitHub Actions logs
