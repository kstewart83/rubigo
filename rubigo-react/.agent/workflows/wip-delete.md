---
description: Abandon WIP work and cleanup
---

# Delete WIP

Abandon a WIP branch, close any associated PR, and cleanup resources.

## Prerequisites

- Active WIP worktree at `wip/<slug>/`
- Draft or open PR may exist on GitHub

## Step 1: Get Context

Determine branch and repo info:
```bash
# From the WIP worktree
git branch --show-current

# Get repo remote URL to extract owner/repo
git remote get-url origin
```

## Step 2: Find and Close PR (if exists)

Search for existing PR:
```
mcp_github-mcp-server_search_pull_requests
  query: "repo:<owner>/<repo> head:<branch>"
```

If a PR exists, close it:
```
mcp_github-mcp-server_update_pull_request
  owner: <owner>
  repo: <repo>
  pullNumber: <PR number>
  state: closed
```

## Step 3: Remove Worktree

From the main repo checkout (not the worktree):
```bash
git worktree remove wip/<slug>
```

If there are uncommitted changes, force removal:
```bash
git worktree remove --force wip/<slug>
```

## Step 4: Delete Local Branch

```bash
git branch -D <type>/<slug>
```

## Step 5: Delete Remote Branch

```bash
git push origin --delete <type>/<slug>
```

## Confirmation

Verify cleanup is complete:
```bash
git worktree list
git branch -a | grep <slug>
```

Both commands should show no results for the deleted branch/worktree.
