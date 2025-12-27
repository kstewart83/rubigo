---
description: Full deployment pipeline: preflight → stage → merge → monitor
---

# WIP Deploy

Complete deployment pipeline from local validation to production monitoring.

## Overview

This is a high-level orchestrator that runs the full WIP deployment sequence:

```
/wip-preflight → /wip-stage → /wip-merge → /wip-monitor
```

## Prerequisites

- Active WIP worktree at `../wip/<slug>/`
- At least one commit pushed (PR exists)
- Clean working directory

## Step 1: Run Preflight

```
/wip-preflight
```

This performs quick local checks:
- Pre-push validation
- Migration validation
- Uncommitted changes check
- Branch push verification

> [!IMPORTANT]
> If preflight fails, fix issues before proceeding.

## Step 2: Run Staging

```
/wip-stage
```

This triggers remote staging validation:
- Clones production database
- Applies migrations
- Runs E2E tests
- Generates staging report

> [!IMPORTANT]
> If staging fails, check the report and fix issues before proceeding.
> Staging is skipped for workflow-only changes (chicken-and-egg).

## Step 3: Run Merge

```
/wip-merge
```

This handles the merge process:
- Sync with main
- Version bump (if required)
- Push and merge PR
- Cleanup worktree

## Step 4: Run Monitor

```
/wip-monitor
```

This monitors the production deployment:
- Watch GitHub Actions deploy workflow
- Tail production service logs
- Health check validation

## Quick Deploy (All Steps)

For a smooth deployment, run each step in sequence and verify success before proceeding to the next.

## Related Workflows

| Workflow | Purpose |
|----------|---------|
| `/wip-preflight` | Step 1: Local validation |
| `/wip-stage` | Step 2: Remote staging |
| `/wip-merge` | Step 3: Merge to main |
| `/wip-monitor` | Step 4: Production monitoring |
| `/pir` | Post Implementation Review (after deploy) |

## Notes

- Each step can be run independently
- Stop at any failure and address before continuing
- Monitor step is optional but recommended for production verification
