# Production Deployment

This folder contains production deployment configuration for rubigo-react.

## Directory Structure

```
production/
├── runner/                  # GitHub self-hosted runner
│   └── _work/              # Runner work directory
├── rubigo-react/           # Application runtime
│   ├── builds/             # Build artifacts
│   ├── current -> builds/X # Symlink to active build
│   └── data/               # Persistent database
│       └── rubigo.db
└── scripts/                # Setup and configuration scripts
    ├── setup.ts            # Initial setup
    └── install-service.ts  # Optional launchd service
```

## Quick Start

1. **Run setup script:**
   ```bash
   bun production/scripts/setup.ts
   ```

2. **Push to main branch** - GitHub Actions will deploy automatically

3. **(Optional) Install launchd service:**
   ```bash
   bun production/scripts/install-service.ts
   ```

## Environment

- **URL:** https://rubigo.kwip.net
- **Port:** 4430 (localhost)
- **Database:** `production/rubigo-react/data/rubigo.db`
