---
description: Monitor production deployment health and logs
---

# WIP Monitor

Monitor production deployment after merge to verify successful rollout.

## Overview

Watches the GitHub Actions deployment workflow and production service health.

## Step 1: Watch Deployment Workflow

```bash
gh run watch
```

Or check the latest deployment run:

```bash
gh run list --workflow=deploy-react.yml --limit=1
```

If deployment fails, view logs:
```bash
gh run view <run_id> --log-failed
```

## Step 2: Check Service Status

From the production directory on the runner:

```bash
# Check service status
systemctl --user status rubigo-react

# View recent logs
journalctl --user -u rubigo-react -n 50 --no-pager
```

## Step 3: Health Check

Verify the application is responding:

```bash
curl -s http://localhost:4430/api/health | jq
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "version": "<version>"
}
```

## Step 4: Optional Log Tail

For extended monitoring:

```bash
journalctl --user -u rubigo-react -f
```

## Common Issues

### Service Failed to Start
```bash
# Check logs for errors
journalctl --user -u rubigo-react -n 100

# Common causes:
# - Database migration failed
# - Port already in use
# - Missing environment variables
```

### Health Check Failing
```bash
# Verify service is running
systemctl --user status rubigo-react

# Check if port is bound
ss -tuln | grep 4430

# Test direct connection
curl -v http://localhost:4430/
```

### Rollback (if needed)
```bash
# View recent successful commits
git log --oneline -5 origin/main

# Revert and push
git revert HEAD
git push
```

## Related Workflows

| Workflow | Purpose |
|----------|---------|
| `/wip-deploy` | Full pipeline (calls this) |
| `/pir` | Post Implementation Review |

## Notes

- Production port is 4430
- Staging port range is 4530-4630
- Service uses systemd user units
- Logs are captured via journald
