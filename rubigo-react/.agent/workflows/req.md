---
description: Requirements-driven development workflow for application functionality
---

# Requirements-Driven Development

This workflow guides changes to application functionality using the requirements ontology. Use this workflow when the work involves **new features, changed behavior, or user-facing functionality** of the Rubigo platform.

## When to Use This Workflow

- Adding new user-facing features
- Changing existing application behavior
- Fixing bugs that require clarifying expected behavior
- Any work that should be documented as a requirement

## The Requirements Ontology

Changes flow through this hierarchy:

```
Objective (WHY - strategic goal)
    └── Feature (WHAT - capability)
           └── Rule (WHO/WANT/SO - user story)
                  └── Scenario (GIVEN/WHEN/THEN - test case)
```

Requirements are maintained in TOML files at `common/scenarios/mmc/`:
- `projects.toml` - Core project management, Rubigo platform features
- Other module-specific files as needed

## Step 1: Identify the Objective

Every feature must trace to a strategic objective. Find the relevant objective:

1. Review existing objectives in `projects.toml` (look for `[[objectives]]` sections)
2. Rubigo platform objectives live under `obj-it-business-systems`
3. If no objective exists, discuss with user whether to create one

Example objectives for Rubigo:
- `obj-rubigo-personnel` - Personnel Directory Management
- `obj-rubigo-strategy` - Strategic Alignment Visibility
- `obj-rubigo-capacity` - Resource Capacity Planning

## Step 2: Define or Update the Feature

Features describe capabilities that fulfill objectives.

```toml
[[features]]
id = "feat-<module>-<capability>"
name = "Human Readable Name"
description = "What this capability enables"
objective_id = "<parent-objective-id>"
status = "planned"  # or "in_progress", "active"
```

Status progression: `planned` → `in_progress` → `active`

## Step 3: Document Rules (User Stories)

Rules capture requirements as user stories:

```toml
[[rules]]
id = "rule-<feature>-<action>"
feature_id = "<parent-feature-id>"
role = "Platform User"  # or specific role
requirement = "do something specific"
reason = "achieve some goal"
status = "draft"  # or "active"
```

Format follows: "As a [role], I want to [requirement], so I can [reason]"

## Step 4: Define Scenarios (Test Cases)

Scenarios are executable specifications in Given-When-Then format:

```toml
[[scenarios]]
id = "scen-<rule>-<case>"
rule_id = "<parent-rule-id>"
name = "Short descriptive name"
narrative = "Given <context>, when <action>, then <outcome>"
status = "draft"  # or "active"
```

> [!TIP]
> Scenarios with `status = "active"` should have corresponding E2E tests.

## Step 5: Implementation

After requirements are documented:

1. Update the feature status to `in_progress`
2. Implement the code changes
3. Create/update E2E tests matching scenarios
4. Update feature status to `active` when complete
5. Update scenario statuses to `active`

## Step 6: Verification

Use the `/e2e` workflow to verify:
- All active scenarios have passing tests
- New functionality works as specified
- No regressions in related features

## Quick Reference: ID Conventions

| Entity | ID Pattern | Example |
|--------|------------|---------|
| Objective | `obj-<area>-<focus>` | `obj-rubigo-personnel` |
| Feature | `feat-<module>-<capability>` | `feat-personnel-crud` |
| Rule | `rule-<feature>-<action>` | `rule-personnel-view` |
| Scenario | `scen-<rule>-<case>` | `scen-personnel-list` |

## Notes

- Requirements changes should be committed with code changes
- Status fields track progress and readiness
- Draft status = planned but not yet implemented
- Active status = implemented and tested
