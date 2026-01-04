---
description: Restart WIP dev server and capture new API token
---

# WIP Restart

Restart the WIP development server and capture the new API token.

## Overview

When the dev server restarts, a new init phrase and API token are generated. This workflow handles the restart and updates `wip.toml` with the new credentials.

## Step 1: Stop Existing Server

If a dev server is running, stop it (Ctrl+C in the terminal or find/kill the process).

> [!CAUTION]
> **NEVER use `pkill -f "bun"`** - The pattern "bun" matches "ubuntu" and will kill user sessions!
> 
> Always kill by specific port:
> ```bash
> fuser -k 28000/tcp
> # Or with lsof
> lsof -ti :28000 | xargs kill -9
> ```

## Step 2: Start Dev Server

From the WIP worktree:

```bash
cd rubigo-react
PORT=<ports.dev from wip.toml> bun run dev
```

Or for isolated mode (separate .next directory):
```bash
cd rubigo-react
PORT=<ports.dev from wip.toml> bun run dev:isolated
```

## Step 3: Capture Init Phrase

Watch the server output for the initialization phrase (four words):

```
🔐 Initialize with phrase: alpha bravo charlie delta
```

Copy this phrase.

## Step 4: Initialize and Get API Token

In a browser or via curl:

```bash
curl -X POST http://localhost:<port>/api/init \
  -H "Content-Type: application/json" \
  -d '{"phrase": "alpha bravo charlie delta"}'
```

The response contains the API token:
```json
{
  "success": true,
  "token": "abc123..."
}
```

## Step 5: Update wip.toml

Update the `[tokens]` section in `wip.toml`:

```toml
[tokens]
init_phrase = "alpha bravo charlie delta"
api_token = "abc123..."
updated_at = "<ISO 8601 timestamp>"
```

> [!IMPORTANT]
> These tokens change on every server restart. Always update wip.toml after restarting.

## Environment Variables

For scripts that need API access:

```bash
export RUBIGO_API_URL="http://localhost:<port>"
export RUBIGO_API_TOKEN="<api_token from wip.toml>"
```

## Related Workflows

| Workflow | Purpose |
|----------|---------|
| `/wip` | Start a new WIP (includes initial server setup) |
| `/wip-preflight` | Local validation (may need API token) |

## Notes

- Tokens are unique per server instance
- The init phrase is shown once at startup
- Store tokens in wip.toml (git-ignored) for convenience
- E2E tests may need the API token in environment
