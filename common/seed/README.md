# Seed Data

This directory contains seed data for populating Rubigo with realistic demonstration content.

## Structure

```
seed/
├── schema/           # SQLite table definitions (DDL)
│   ├── 001_personnel.sql
│   ├── 002_projects.sql
│   └── ...
├── profiles/         # Profile-specific seed data
│   └── mmc/         # "Midwest Mechanical Corp" demo profile
│       ├── collaboration/
│       │   ├── chat.sql      # Chat channels, memberships, messages
│       │   └── email.sql     # Email threads, emails, recipients
│       ├── headshots/        # Personnel profile photos
│       ├── infrastructure/
│       │   ├── equipment.sql # Racks, components, assets
│       │   ├── roles.sql     # Organization roles
│       │   └── sites.sql     # Regions, sites, buildings, spaces
│       ├── projects/
│       │   └── pmo.sql       # Projects, objectives, features, rules
│       ├── personnel.sql     # Employee data
│       └── calendar.sql      # Calendar events
└── builds/           # Compiled SQLite database (auto-generated)
    └── profiles.sqlite
```

## How It Works

1. **Schema files** (`schema/*.sql`) define the table structure
2. **Profile data** (`profiles/<name>/*.sql`) contains INSERT statements
3. **Build script** (`bun run scenarios:build`) compiles into `builds/profiles.sqlite`
4. **Sync script** (`bun run sync:scenario`) pushes data to a running Rubigo instance

## Auto-Rebuild

The sync script automatically detects when any `.sql` file is newer than `profiles.sqlite` and rebuilds before syncing. No manual rebuild needed.

## Adding New Data

1. Edit or add `.sql` files in the appropriate profile subdirectory
2. Run `bun run sync:scenario -- --mode=full --token=xxx`
3. The database auto-rebuilds, then syncs

## Adding New Profiles

1. Create a new directory under `profiles/` (e.g., `profiles/acme/`)
2. Add SQL files following the same structure as `mmc/`
3. Use `--profile=acme` when syncing
