---
description: Start isolated work in a git worktree for multi-agent development
---

# Start WIP (Work In Progress)

This workflow creates an isolated workspace for feature development without disturbing the main branch.

## Step 1: Understand the Goal

Before creating the worktree, conduct a dialogue to determine:

1. **What type of work is this?**
   - `feature/` - New functionality
   - `bugfix/` - Fixing broken behavior
   - `docs/` - Documentation only
   - `chore/` - Maintenance, deps, tooling

2. **What is a concise slug for this work?** (e.g., `add-personnel-search`)

3. **Draft a PR title and description**

## Step 2: Confirm Plan with User

Present the proposed:
- Branch name: `<type>/<slug>`
- Worktree path: `wip/<slug>/`
- PR title and description

Get user approval before proceeding.

## Step 3: Create Worktree

From the repo root:
```bash
git worktree add wip/<slug> -b <type>/<slug>
```

## Step 4: Push Branch to Remote

```bash
cd wip/<slug>
git push -u origin <type>/<slug>
```

## Step 5: Create Draft PR

Use GitHub MCP to create a draft pull request:
```
mcp_github-mcp-server_create_pull_request
  owner: <repo-owner>
  repo: <repo-name>
  title: <PR title>
  body: <PR description>
  head: <type>/<slug>
  base: main
  draft: true
```

## Step 6: Begin Work

Work continues in `wip/<slug>/` using absolute paths. The main checkout remains untouched.

## Notes

- The `wip/` directory is git-ignored at the repo root
- Multiple WIP workspaces can exist simultaneously
- Use `/wip-publish` to complete work, `/wip-delete` to abandon
