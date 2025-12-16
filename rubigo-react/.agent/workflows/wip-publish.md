---
description: Complete and merge WIP work, then cleanup
---

# Publish WIP

Complete a WIP branch by rebasing, testing, merging, and cleaning up.

## Prerequisites

- Active WIP worktree at `wip/<slug>/`
- At least one commit pushed to the branch
- PR may or may not exist on GitHub

## Step 1: Get Context

Determine branch and repo info:
```bash
# Get current branch name
git branch --show-current

# Get repo remote URL to extract owner/repo
git remote get-url origin
```

Find existing PR:
```
mcp_github-mcp-server_search_pull_requests
  query: "repo:<owner>/<repo> head:<branch> is:open"
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

## Step 3: Run E2E Tests

Follow the `/e2e` workflow to validate all tests pass.

## Step 4: Version Bump

Follow `/publish` guidelines to bump version in `rubigo.toml`.

## Step 5: Push Changes

Push the rebased branch (force-with-lease is safe after rebase):
```bash
git push --force-with-lease
```

> [!NOTE]
> `--force-with-lease` fails if someone else pushed since your last fetch, preventing accidental overwrites.

## Step 6: Ensure PR Exists

If no PR exists yet, create one:
```
mcp_github-mcp-server_create_pull_request
  owner: <owner>
  repo: <repo>
  title: <PR title>
  body: <PR description>
  head: <branch>
  base: main
  draft: false
```

If PR already exists as draft, mark it ready:
```
mcp_github-mcp-server_update_pull_request
  owner: <owner>
  repo: <repo>
  pullNumber: <PR number>
  draft: false
```

## Step 7: Merge PR

Use GitHub MCP:
```
mcp_github-mcp-server_merge_pull_request
  owner: <owner>
  repo: <repo>
  pullNumber: <PR number>
  merge_method: squash
```

## Step 8: Cleanup

From the main repo checkout (not the worktree):
```bash
# Remove the worktree
git worktree remove wip/<slug>

# Delete local branch
git branch -D <type>/<slug>
```

## Step 9: Sync Main

Update the main checkout with merged changes:
```bash
git checkout main
git pull
```

## Notes

- The remote branch is automatically deleted by GitHub when the PR is merged
- If merge fails due to checks, wait for CI and retry
