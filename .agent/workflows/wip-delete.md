---
description: Abandon WIP work and cleanup
---

# Delete WIP

Abandon a WIP branch, close any associated PR, and cleanup resources.

## Prerequisites

- Active WIP worktree at `../wip/<slug>/`
- Draft or open PR may exist on GitHub

## Step 1: Get Context

Read `wip.toml` from the WIP worktree:
- `worktree.branch` - Branch name
- `worktree.slug` - Worktree slug
- `pr_number` - GitHub PR number (if exists)

Get repo info:
```bash
git remote get-url origin
```

## Step 2: Close PR (if exists)

If `pr_number` is set in `wip.toml`:

```
mcp_github-mcp-server_update_pull_request
  owner: <owner>
  repo: <repo>
  pullNumber: <pr_number>
  state: closed
```

## Step 3: Remove Worktree

From the main repo checkout (not the worktree):
```bash
git worktree remove ../wip/<slug>
```

If there are uncommitted changes, force removal:
```bash
git worktree remove --force ../wip/<slug>
```

## Step 4: Delete Local Branch

```bash
git branch -D <branch>
```

## Step 5: Delete Remote Branch

```bash
git push origin --delete <branch>
```

## Step 6: Verify Cleanup

Confirm cleanup is complete:
```bash
git worktree list
git branch -a | grep <slug>
```

Both commands should show no results for the deleted branch/worktree.

## Notes

- This workflow is for abandoning work, not completing it
- Use `/wip-merge` to complete and merge work
- Uncommitted changes will be lost when using `--force`
