---
description: Complete and merge WIP work, then cleanup
---

# Publish WIP

Complete a WIP branch by rebasing, testing, merging, and cleaning up.

## Prerequisites

- Active WIP worktree at `wip/<slug>/`
- Draft PR exists on GitHub

## Step 1: Sync with Main

From the WIP worktree:
```bash
cd /path/to/repo/wip/<slug>
git fetch origin
git rebase origin/main
```

If conflicts occur, resolve them and continue:
```bash
git rebase --continue
```

## Step 2: Run E2E Tests

Follow the `/e2e` workflow to validate all tests pass.

## Step 3: Version Bump

Follow `/publish` guidelines to bump version in `rubigo.toml`.

## Step 4: Push Changes

Push the rebased branch (force-with-lease is safe after rebase):
```bash
git push --force-with-lease
```

> **Note:** `--force-with-lease` fails if someone else pushed since your last fetch, preventing accidental overwrites.

## Step 5: Mark PR Ready

Use GitHub MCP:
```
mcp_github-mcp-server_update_pull_request
  owner: <repo-owner>
  repo: <repo-name>
  pullNumber: <PR number>
  draft: false
```

## Step 6: Merge PR

Use GitHub MCP:
```
mcp_github-mcp-server_merge_pull_request
  owner: <repo-owner>
  repo: <repo-name>
  pullNumber: <PR number>
  merge_method: squash
```

## Step 7: Cleanup

Remove the worktree and local branch:
```bash
cd /path/to/repo
git worktree remove wip/<slug>
git branch -D <type>/<slug>
```

## Step 8: Sync Main

Update the main checkout with merged changes:
```bash
git checkout main
git pull
```
