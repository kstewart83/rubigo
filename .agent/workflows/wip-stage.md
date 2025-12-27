---
description: Stage WIP branch on production runner before deployment
---

# WIP Stage

Stage the current WIP branch on the production runner to validate changes before deployment.

## Prerequisites

- Active WIP worktree at `../wip/<slug>/`
- At least one commit pushed to the branch
- PR exists on GitHub (created via `/wip-commit`)

## Step 1: Get Context

From the WIP worktree, read `wip.toml`:
- `worktree.branch` - Branch name
- `worktree.slug` - Worktree slug
- `pr_number` - GitHub PR number

Get repo info:
```bash
git remote get-url origin
```

## Step 2: Trigger Staging Workflow

Use GitHub CLI to trigger the staging workflow:

```bash
gh workflow run stage-react.yml \
  --field pr_number=<pr_number> \
  --field branch=<branch>
```

## Step 3: Monitor Workflow

Watch the workflow progress:

```bash
gh run watch
```

Or check the latest run:

```bash
gh run list --workflow=stage-react.yml --limit=1
```

## Step 4: Download Staging Report

Once the workflow completes, download the staging report artifact:

```bash
gh run download <run_id> --name staging-report
```

Read the staging report:
```bash
cat staging-report.json
```

## Step 5: Update wip.toml

Add or update the `[staging]` section in `wip.toml`:

```toml
[staging]
passed = true  # or false if staging failed
timestamp = "<ISO 8601 timestamp>"
commit = "<current HEAD commit hash>"
workflow_run_id = <GitHub Actions run ID>
report_url = "https://github.com/<owner>/<repo>/actions/runs/<run_id>"

[staging.results]
sanity_check = { status = "success" }
db_migration = { status = "success" }
e2e_tests = { status = "success" }
```

## Step 6: Report Results

If staging **passed**:
- Inform user staging is complete
- Ready for `/wip-deploy`

If staging **failed**:
- Show failed step details from report
- User must fix issues and re-run `/wip-stage`

> [!IMPORTANT]
> Do not proceed to `/wip-deploy` if staging failed. The staging report acts as a gate.

## Related Workflows

| Workflow | Purpose |
|----------|---------|
| `/wip-commit` | Must be run first to push changes |
| `/wip-deploy` | Deploy after successful staging |
| `/wip-delete` | Abandon work if staging reveals major issues |

## Notes

- Staging creates a copy of production database
- Staging runs on port 4431 (vs production on 4430)
- Staging server is stopped after tests complete
- Staging report is uploaded as GitHub artifact
