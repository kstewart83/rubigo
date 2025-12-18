# Production Operations SOP

Standard Operating Procedures for the Rubigo production environment.

## Finding the Initialization Token

When the application is deployed fresh or the database is reset, a 4-word initialization phrase is generated. This phrase is required to create the Global Administrator account.

### Method 1: Check stdout.log

The init token is logged to stdout when the server starts. Location:

```
production/runner/_work/rubigo/rubigo/production/rubigo-react/stdout.log
```

View the log:
```bash
cat production/runner/_work/rubigo/rubigo/production/rubigo-react/stdout.log
```

Look for output like:
```
============================================================
🔐 INITIALIZATION REQUIRED
============================================================

   INIT TOKEN: [word1] [word2] [word3] [word4]

============================================================
```

### Method 2: Search for INIT TOKEN

If you need to search across multiple log files:
```bash
grep -r "INIT TOKEN" production/runner/_work/
```

### Method 3: Check GitHub Actions Logs

If the token was generated during a deployment:
```bash
gh run view <run-id> --repo <owner>/<repo> --log | grep "INIT TOKEN"
```

## Log File Locations

| File | Purpose |
|------|---------|
| `production/runner/_work/.../rubigo-react/stdout.log` | Application stdout |
| `production/runner/_work/.../rubigo-react/stderr.log` | Application stderr |
| `production/runner/_diag/*.log` | GitHub Actions runner diagnostics |

## Database Location

The persistent database is stored at:
```
production/runner/_work/rubigo/rubigo/production/rubigo-react/data/rubigo.db
```

## Restarting the Service

If running via GitHub Actions runner, push a new commit to trigger redeploy, or manually restart:

```bash
# Navigate to the current build
cd production/runner/_work/rubigo/rubigo/production/rubigo-react/current

# Stop the running process (find PID first)
lsof -i :4430

# Start the server
PORT=4430 bun run start > ../stdout.log 2> ../stderr.log &
```

## Common Issues

### "database is locked" during build
The production service may be holding the database open. The deployment workflow should stop the service before building. If it fails, retry the deployment.

### Init token mismatch
If you see a token mismatch error:
```
[Init] Token validation failed: mismatch
[Init]   Expected: [new words]
[Init]   Received: [old words]
```

Use the **Expected** words (the newly generated token), not the old cached one.

### Cannot find logs
Logs are inside the runner's work directory, not the top-level production folder:
```
production/runner/_work/rubigo/rubigo/production/rubigo-react/
```

## Finding the API Token

The API token is used for programmatic access (MCP, REST API). Unlike the init token, the API token:
- **Regenerates on every server restart** (not persisted to database)
- Is logged to stdout.log on startup
- Is required for all `/api/*` endpoints

### Retrieving the Current API Token

```bash
cat production/runner/_work/rubigo/rubigo/production/rubigo-react/stdout.log | grep "API Token"
```

Look for output like:
```
API Token: 27d33ff9bc044fe74b70d95457ba38b2
Use this token for programmatic API access.
```

### After Deployment

Each deployment restarts the service, generating a new API token. Check stdout.log after every deployment to get the new token.

## MCP Server Configuration

The MCP endpoint is available at `https://rubigo.kwip.net/api/mcp`. Configuration:

```json
{
  "mcpServers": {
    "rubigo": {
      "type": "http",
      "url": "https://rubigo.kwip.net/api/mcp",
      "headers": {
        "Authorization": "Bearer <API_TOKEN>"
      }
    }
  }
}
```

Test with curl:
```bash
curl -X POST https://rubigo.kwip.net/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <API_TOKEN>" \
  -d '{"jsonrpc":"2.0","method":"resources/list","id":1}'
```

## Lessons Learned

### SQLite Concurrent Access (Dec 2024)

**Problem:** Next.js builds with 7+ workers accessing SQLite simultaneously caused `SQLITE_BUSY` errors.

**Solution:** Set `PRAGMA busy_timeout = 30000` in `src/db/index.ts`. This makes SQLite wait up to 30 seconds for locks instead of immediately failing.

**Key insight:** WAL mode alone isn't sufficient for concurrent access during builds. The busy_timeout pragma is essential.

### API Token Persistence (Dec 2024)

**Problem:** API returned "system not initialized" after server restarts, even though the system was initialized.

**Cause:** API token was stored in `process.env` (ephemeral) rather than database.

**Solution:** Modified `generateAndLogToken()` to call `getOrCreateApiToken()` for initialized systems, regenerating the token on each startup.

**Key insight:** Any secrets stored in environment variables are lost on restart. Either persist to database or regenerate on startup.
