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
