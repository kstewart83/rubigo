# Production Deployment

This folder contains production deployment configuration for rubigo-react.

## Overview

The deployment uses a **self-hosted GitHub Actions runner** to deploy the application to an external folder structure outside the git repository.

## Folder Structure

Set up this structure on your deployment machine:

```
/path/to/rubigo/           # RUBIGO_DEPLOY_ROOT
├── rubigo/                # Git repository clone
├── runner/                # GitHub Actions self-hosted runner
│   └── _work/             # Runner work directory (auto-created)
├── production/            # Production runtime
│   └── rubigo-react/
│       ├── builds/        # Versioned build artifacts
│       ├── current/       # Symlink → active build
│       ├── data/          # Persistent database
│       ├── logs/          # Application logs
│       └── backups/       # Database backups
└── staging/               # Staging environment (mirrors production)
    └── rubigo-react/
        ├── code/          # Staged codebase
        ├── data/          # Cloned production database
        └── logs/          # Staging logs
```

## Setup Guide

### 1. Create Folder Structure

```bash
mkdir -p /path/to/rubigo/{runner,production,staging}
cd /path/to/rubigo
git clone git@github.com:kstewart83/rubigo.git rubigo
```

### 2. Install GitHub Actions Runner

```bash
cd /path/to/rubigo/runner

# Download latest runner (check https://github.com/actions/runner/releases)
curl -o actions-runner.tar.gz -L https://github.com/actions/runner/releases/download/v2.330.0/actions-runner-linux-x64-2.330.0.tar.gz
tar xzf actions-runner.tar.gz && rm actions-runner.tar.gz

# Configure runner (get token from GitHub → Settings → Actions → Runners → New)
./config.sh --url https://github.com/kstewart83/rubigo \
  --token YOUR_TOKEN \
  --name your-runner-name \
  --labels NUC \
  --work _work \
  --unattended
```

### 3. Install Runner Service

Create systemd user service for the runner:

```bash
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/github-actions-runner.service << EOF
[Unit]
Description=GitHub Actions Runner
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/rubigo/runner
ExecStart=/path/to/rubigo/runner/run.sh
Restart=always
RestartSec=10
Environment="PATH=$HOME/.bun/bin:/usr/local/bin:/usr/bin:/bin"
Environment="RUBIGO_DEPLOY_ROOT=/path/to/rubigo"

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now github-actions-runner.service
```

> **Important:** The `RUBIGO_DEPLOY_ROOT` environment variable must be set in the runner service. All deployment workflows use this to locate the production folder.

### 4. Install Application Service

From the rubigo repository:

```bash
cd /path/to/rubigo/rubigo
bun run production/install-service.ts /path/to/rubigo
```

This creates a systemd service that runs the application from `$RUBIGO_DEPLOY_ROOT/production/rubigo-react/current`.

### 5. Initial Deployment

Trigger a deployment manually or push to main:

```bash
gh workflow run deploy-react.yml
```

## Services

| Service | Description | Commands |
|---------|-------------|----------|
| `github-actions-runner` | GitHub Actions runner | `systemctl --user {start\|stop\|status} github-actions-runner.service` |
| `rubigo-react` | Next.js application | `systemctl --user {start\|stop\|status} rubigo-react.service` |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `RUBIGO_DEPLOY_ROOT` | Base path for all deployment folders (set in runner service) |
| `DATABASE_URL` | SQLite database path (set in app service) |
| `NODE_ENV` | Always `production` |

## Deployment Workflow

```
Push to main → deploy-react.yml → Runner picks up job
                                        ↓
                    Validate RUBIGO_DEPLOY_ROOT exists
                                        ↓
                    Sanity check (package.json, bun.lock, next.config)
                                        ↓
                    Install deps, apply DB schema, build
                                        ↓
                    Swap symlink, restart service
                                        ↓
                    Health check on localhost:4430
```

## Staging Workflow

Before deploying major changes, use staging:

```bash
# Trigger staging for a PR
gh workflow run stage.yml --field pr_number=123 --field branch=feature/my-feature
```

Staging clones the production database and runs tests against port 4431.

## Troubleshooting

### Check runner status
```bash
systemctl --user status github-actions-runner.service
journalctl --user -u github-actions-runner.service -f
```

### Check app status
```bash
systemctl --user status rubigo-react.service
journalctl --user -u rubigo-react.service -f
```

### Verify environment variable
```bash
systemctl --user show github-actions-runner.service | grep RUBIGO_DEPLOY_ROOT
```

## Files in This Folder

| File | Purpose |
|------|---------|
| `install-service.ts` | Installs rubigo-react systemd service |
| `rubigo-react.service.template` | Service template with `{{RUBIGO_DEPLOY_ROOT}}` placeholder |
| `SOP.md` | Standard Operating Procedures |
