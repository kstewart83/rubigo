# WIP Sync

Sync seed data to the WIP development server.

## Prerequisites

- WIP worktree exists with `wip.toml`
- Dev server running (use `/wip-restart` first)
- API token captured in `wip.toml`

## Step 1: Get Context

Read from `wip.toml`:
- `ports.dev` - Server port
- `tokens.api_token` - API token

## Step 2: Build Scenario Database

```bash
cd rubigo-react
bun run scenarios:build
```

This compiles SQL files from `common/seed/profiles/` into `common/seed/builds/profiles.sqlite`.

## Step 3: Sync to Dev Server

```bash
cd rubigo-react
bun run sync:scenario mmc --url=http://localhost:<port> --token=<api_token>
```

Replace `<port>` and `<api_token>` with values from `wip.toml`.

## Example (Full Command)

```bash
cd rubigo-react
bun run scenarios:build
bun run sync:scenario mmc --url=http://localhost:41000 --token=b34242120b28dd6f2add545d237fc64d
```

## Available Profiles

| Profile | Description |
|---------|-------------|
| `mmc` | Midwest Manufacturing Co. (~1000 records) |

## Notes

- Sync creates records if they don't exist, skips duplicates
- Headshots are synced from `common/seed/profiles/<profile>/headshots/`
- Team member sync may warn about unresolved references (safe to ignore)
