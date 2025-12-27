---
description: Post-implementation review after deployment
---

# Post Implementation Review (PIR)

Audit agent behavior and catch process issues after completing work.

## When to Run

Run `/pir` after:
- `/wip-deploy` completes successfully
- Any significant deployment to production

## Step 1: Gather Context

Collect information about the completed work:
- PR number and title
- Related issues (from `wip.toml`)
- Staging report results
- Deployment status

## Step 2: Command Hygiene Check

Review commands run during this work session:

**Check for non-bun commands:**
- Were all commands backed by `bun run` scripts?
- Were raw `git`, `npm`, or shell commands used?

If raw commands were needed:
- Document what was missing from scripts
- Consider adding to `package.json` for future use

> [!TIP]
> Use `/todo` to create issues for missing scripts.

## Step 3: Workflow Adherence

Review if established workflows were followed:

- [ ] Was `/wip` used to create the worktree?
- [ ] Was `/wip-commit` used for commits?
- [ ] Was `/wip-stage` run before deployment?
- [ ] Did staging pass before deploying?
- [ ] Was version bumped appropriately?

If any were skipped, document why.

## Step 4: Issues Encountered

Document any issues encountered:
- Unexpected errors
- Workarounds needed
- Documentation gaps

Consider:
- Creating issues for recurring problems
- Updating workflows to prevent future issues
- Updating SOP documentation

## Step 5: Generate Review Notes

Create a brief summary:

```markdown
## PIR: <feature/branch name>

### Work Completed
- <summary of changes>

### Issues Resolved
- #<issue numbers>

### Process Notes
- <any deviations from standard workflow>
- <suggested improvements>

### Action Items
- [ ] <follow-up tasks if any>
```

## Step 6: Close Related Issues

If issues were fully resolved by this deployment:

```
mcp_github-mcp-server_update_issue
  owner: <owner>
  repo: <repo>
  issueNumber: <issue>
  state: closed
```

## Notes

- PIR is optional but recommended
- Focus on process improvement, not blame
- Tag issues for future reference
- Keep reviews brief and actionable
