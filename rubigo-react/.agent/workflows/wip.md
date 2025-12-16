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

## Step 5: Begin Work

Work continues in `wip/<slug>/` using absolute paths. The main checkout remains untouched.

> [!NOTE]
> A draft PR cannot be created until the branch has at least one commit that differs from `main`. The PR will be created after the first commit is pushed.

## Step 6: First Commit and PR Creation

When the user asks to commit and push changes:

1. **Commit and push** the changes to the remote branch

2. **Get repo info** by parsing the git remote:
   ```bash
   git remote get-url origin
   # Returns: git@github.com:<owner>/<repo>.git or https://github.com/<owner>/<repo>.git
   ```

3. **Check if PR exists** using GitHub MCP:
   ```
   mcp_github-mcp-server_search_pull_requests
     query: "repo:<owner>/<repo> head:<type>/<slug> is:open"
   ```

4. **Create draft PR** if none exists:
   ```
   mcp_github-mcp-server_create_pull_request
     owner: <owner>
     repo: <repo>
     title: <PR title>
     body: <PR description>
     head: <type>/<slug>
     base: main
     draft: true
   ```

5. **Report the PR URL** to the user

## Notes

- The `wip/` directory is git-ignored at the repo root
- Multiple WIP workspaces can exist simultaneously
- GitHub requires at least one commit before a PR can be created
- Use `/wip-publish` to complete work, `/wip-delete` to abandon
