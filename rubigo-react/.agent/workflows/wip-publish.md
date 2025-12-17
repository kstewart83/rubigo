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

## Step 3: Run Pre-Push Validation

> [!IMPORTANT]
> This step is **REQUIRED** before pushing. Do not skip.

// turbo
From `rubigo-react/`:
```bash
bun run pre-push-check
```

This checks for:
- **Errors (must fix)**: Local paths, secrets, `.only()` patterns
- **Warnings (review)**: Debug statements, localhost URLs, large files, `.env` files

If errors are found, fix them before proceeding. Warnings require explicit user approval.

## Step 4: Run E2E Tests

// turbo
Follow the `/e2e` workflow or run directly:
```bash
bun run test:e2e:full
```

## Step 5: Version Bump

> [!IMPORTANT]
> This step is **REQUIRED** for every merge to main.

Edit `rubigo-react/rubigo.toml`:
```toml
[package]
version = "x.y.z"
```

### Version Rules (Pre-1.0.0)

| Change Type | Bump | Example |
|-------------|------|---------|
| Breaking UI changes (E2E tests modified) | **Minor** | `0.3.0` → `0.4.0` |
| New features | **Minor** | `0.3.0` → `0.4.0` |
| Deps, docs, bug fixes | **Patch** | `0.3.0` → `0.3.1` |

### Version Rules (Post-1.0.0)

| Change Type | Bump | Example |
|-------------|------|---------|
| Breaking UI changes (E2E tests modified) | **Major** | `1.0.0` → `2.0.0` |
| New features, backwards-compatible | **Minor** | `1.0.0` → `1.1.0` |
| Deps, docs, bug fixes | **Patch** | `1.0.0` → `1.0.1` |

> [!TIP]
> A change is **breaking** if existing E2E tests had to be modified to pass.

Commit the version bump:
```bash
git add rubigo.toml
git commit --amend --no-edit
```

## Step 6: Push Changes

Push the rebased branch (force-with-lease is safe after rebase):
```bash
git push --force-with-lease
```

> [!NOTE]
> `--force-with-lease` fails if someone else pushed since your last fetch.

## Step 7: Ensure PR Exists

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

## Step 8: Merge PR

Use GitHub MCP:
```
mcp_github-mcp-server_merge_pull_request
  owner: <owner>
  repo: <repo>
  pullNumber: <PR number>
  merge_method: squash
```

## Step 9: Cleanup

From the main repo checkout (not the worktree):
```bash
# Remove the worktree
git worktree remove wip/<slug>

# Delete local branch
git branch -D <type>/<slug>

# Delete remote branch (if not auto-deleted)
git push origin --delete <type>/<slug>

# Prune stale remote tracking refs
git fetch --prune
```

## Step 10: Sync Main

Update the main checkout with merged changes:
```bash
git checkout main
git pull
```

## Checklist Summary

Before merging, ensure:
- [ ] Pre-push validation passed (no errors)
- [ ] E2E tests passed (or failures are pre-existing)
- [ ] Version bumped in `rubigo.toml`
- [ ] Commit message follows conventional format

## Notes

- GitHub may auto-delete the remote branch on merge
- If merge fails due to checks, wait for CI and retry
