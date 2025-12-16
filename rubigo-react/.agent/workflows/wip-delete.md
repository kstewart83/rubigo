---
description: Abandon WIP work and cleanup
---

# Delete WIP

Abandon a WIP branch, close the PR, and cleanup resources.

## Prerequisites

- Active WIP worktree at `wip/<slug>/`
- Draft or open PR may exist on GitHub

## Step 1: Close PR (if exists)

Use GitHub MCP:
```
mcp_github-mcp-server_update_pull_request
  owner: <repo-owner>
  repo: <repo-name>
  pullNumber: <PR number>
  state: closed
```

## Step 2: Remove Worktree

```bash
cd /path/to/repo
git worktree remove wip/<slug>
```

If there are uncommitted changes, force removal:
```bash
git worktree remove --force wip/<slug>
```

## Step 3: Delete Local Branch

```bash
git branch -D <type>/<slug>
```

## Step 4: Delete Remote Branch

```bash
git push origin --delete <type>/<slug>
```

## Confirmation

Verify cleanup is complete:
```bash
git worktree list
git branch -a | grep <slug>
```
