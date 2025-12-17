---
description: Create a GitHub issue to note a bug, feature, or work item
---

# Todo

Quickly create a GitHub issue without disrupting current work.

## Usage

- `/todo` - Interactive: gather context and create issue
- `/todo <description>` - Create issue with provided context

## Step 1: Gather Context

Determine from conversation or user input:

1. **Type**: bug, feature, chore, docs
2. **Title**: Concise summary
3. **Description**: Details, context, reproduction steps
4. **Labels**: Based on type (optional)

If context is unclear, ask user for:
- What type of work is this?
- Brief description of the issue

## Step 2: Get Repo Info

// turbo
```bash
git remote get-url origin
```

Parse owner and repo from URL.

## Step 3: Create Issue

Use GitHub MCP:
```
mcp_github-mcp-server_issue_write
  method: create
  owner: <owner>
  repo: <repo>
  title: "<type>: <title>"
  body: |
    ## Context
    <description>

    ## Source
    Noted during: <current task/conversation context>

    ---
    *Created via /todo workflow*
  labels: ["<type>"]
```

## Step 4: Report

Provide the issue URL to user and continue previous work.

## Labels by Type

| Type | Label | Example Title |
|------|-------|---------------|
| bug | `bug` | `bug: Calendar events not persisting` |
| feature | `enhancement` | `feature: Add recurring events` |
| chore | `chore` | `chore: Update dependencies` |
| docs | `documentation` | `docs: Add API documentation` |

## Notes

- This workflow is designed to be quick and non-disruptive
- Gather relevant context from recent conversation
- Return to previous work after creating issue
