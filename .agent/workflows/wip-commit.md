---
description: Create a checkpoint commit, push, and manage PR
---

# WIP Commit

Create a checkpoint commit, push to remote, and create/update the pull request.

## Usage

- `/wip-commit` - Interactive: gather commit message and push
- `/wip-commit <message>` - Commit with provided message

## Prerequisites

- Active WIP worktree at `../wip/<slug>/`
- Changes staged or ready to stage

## Step 1: Get Context

From the WIP worktree:
```bash
# Get current branch name
git branch --show-current

# Get repo remote URL to extract owner/repo
git remote get-url origin
```

Read `wip.toml` to get the slug and PR number (if exists).

## Step 2: Stage and Commit

If changes are not staged:
```bash
git add -A
```

Commit with conventional commit format:
```bash
git commit -m "<type>(<scope>): <description>"
```

> [!TIP]
> Use the work type from `wip.toml` to inform the commit type:
> - `feature/` → `feat`
> - `bugfix/` → `fix`
> - `docs/` → `docs`
> - `chore/` → `chore`

## Step 3: Push to Remote

If this is the first push:
```bash
git push -u origin <branch>
```

For subsequent pushes:
```bash
git push
```

## Step 4: Create or Update PR

Check if PR exists by reading `pr_number` from `wip.toml`.

### If no PR exists:

1. **Create draft PR**:
   ```
   mcp_github-mcp-server_create_pull_request
     owner: <owner>
     repo: <repo>
     title: "<type>: <description from slug>"
     body: "Work in progress"
     head: <branch>
     base: main
     draft: true
   ```

2. **Update wip.toml** with the PR number:
   ```toml
   pr_number = <new_pr_number>
   ```

### If PR exists:

No action needed - push automatically updates the PR.

## Step 5: Report

Provide the PR URL to user:
```
https://github.com/<owner>/<repo>/pull/<pr_number>
```

## Notes

- GitHub requires at least one commit before a PR can be created
- Draft PRs signal work is not ready for review
- Use `/wip-merge` when ready to finalize and merge
