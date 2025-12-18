---
description: Ensure database schema changes include corresponding migration files
---

# Database Migration Rule

When modifying `rubigo-react/src/db/schema.ts`, you MUST also generate a corresponding Drizzle migration file.

## Required Steps

1. **Make schema changes** in `schema.ts`

2. **Generate migration file**:
   ```bash
   cd rubigo-react
   bunx drizzle-kit generate --name <descriptive_name>
   ```

3. **Review the generated migration** in `drizzle/XXXX_<name>.sql`

4. **Commit both files together**:
   - `src/db/schema.ts`
   - `drizzle/XXXX_<name>.sql`
   - `drizzle/meta/_journal.json` (auto-updated)

## Why This Matters

The deployment workflow runs `drizzle-kit migrate` (not `push`), which only applies **committed migration files**. Schema changes without migrations will cause `SQLiteError: no such table` errors in production.

## Verification

Before pushing, run migrations locally to verify:
```bash
bunx drizzle-kit migrate
```
