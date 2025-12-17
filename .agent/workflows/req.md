---
description: Requirements-driven development workflow
---

# Requirements-Driven Development

Guide changes to application functionality using the requirements ontology.

## When to Use

- Adding new user-facing features
- Changing existing application behavior
- Fixing bugs that need clarified expected behavior

## The Requirements Ontology

```
Objective (WHY - strategic goal)
    └── Feature (WHAT - capability)
           └── Rule (WHO/WANT/SO - user story)
                  └── Scenario (GIVEN/WHEN/THEN - test case)
```

Requirements are in TOML files at `common/scenarios/`:
- `projects.toml` - Core project management
- Module-specific files as needed

## Step 1: Identify the Objective

Find or create the parent objective:

1. Review existing objectives in relevant TOML file
2. Rubigo platform objectives under `obj-it-business-systems`
3. Discuss with user if none exists

## Step 2: Define the Feature

```toml
[[features]]
id = "feat-<module>-<capability>"
name = "Human Readable Name"
description = "What this capability enables"
objective_id = "<parent-objective-id>"
status = "planned"
```

Status: `planned` → `in_progress` → `active`

## Step 3: Document Rules (User Stories)

```toml
[[rules]]
id = "rule-<feature>-<action>"
feature_id = "<parent-feature-id>"
role = "Platform User"
requirement = "do something specific"
reason = "achieve some goal"
status = "draft"
```

Format: "As a [role], I want to [requirement], so I can [reason]"

## Step 4: Define Scenarios (Test Cases)

```toml
[[scenarios]]
id = "scen-<rule>-<case>"
rule_id = "<parent-rule-id>"
name = "Short descriptive name"
narrative = "Given <context>, when <action>, then <outcome>"
status = "draft"
```

> [!TIP]
> Active scenarios should have corresponding E2E tests.

## Step 5: Implementation

1. Update feature status to `in_progress`
2. Implement code changes
3. Create E2E tests matching scenarios
4. Update feature status to `active`

## ID Conventions

| Entity | Pattern | Example |
|--------|---------|---------|
| Objective | `obj-<area>-<focus>` | `obj-rubigo-personnel` |
| Feature | `feat-<module>-<capability>` | `feat-personnel-crud` |
| Rule | `rule-<feature>-<action>` | `rule-personnel-view` |
| Scenario | `scen-<rule>-<case>` | `scen-personnel-list` |
