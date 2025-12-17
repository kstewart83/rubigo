---
description: How to create and deploy database schema migrations
---

# Database Migrations

Follow this workflow when making changes to the database schema.

## When to Use

Use this workflow when you modify any file in `src/db/schema.ts`.

## Step 1: Modify the Schema

Edit `src/db/schema.ts` with your changes (add tables, columns, etc.).

## Step 2: Generate Migration

// turbo
From `rubigo-react/`:
```bash
bun run db:generate
```

This creates a new migration file in `drizzle/` like `0001_descriptive_name.sql`.

## Step 3: Review the Migration

Open the generated SQL file and verify:
- The SQL is correct
- No unexpected DROP statements
- Data will be preserved

> [!CAUTION]
> Destructive operations (DROP COLUMN, DROP TABLE) will cause data loss in production. If you see these, consider if they're intentional.

## Step 4: Test Locally

// turbo
Apply the migration to your local database:
```bash
bun run db:migrate
```

Verify the application still works:
```bash
bun run dev
```

## Step 5: Commit Migration Files

Include **both** the schema change and migration file:
```bash
git add src/db/schema.ts
git add drizzle/
git commit -m "feat(db): add xyz column to users table"
```

> [!IMPORTANT]
> Never commit schema changes without the corresponding migration file. The deploy workflow will fail if migrations are missing.

## How It Works

| Environment | Command | Behavior |
|-------------|---------|----------|
| **Local dev** | `db:push` | Direct sync (fast iteration) |
| **Production** | `db:migrate` | File-based migrations only |

This ensures production only applies reviewed, committed migrations.

## Troubleshooting

### Migration fails in CI

The production database is behind. Options:
1. Check if migration file was committed
2. Verify migration order is correct
3. Check for conflicts with existing data

### Need to modify a migration

If the migration hasn't been deployed yet:
```bash
# Delete the migration file
rm drizzle/XXXX_name.sql

# Regenerate
bun run db:generate
```

If the migration has been deployed, create a new migration instead.
