---
description: Ensure new features have corresponding requirements documented
trigger: model_decision
globs: ["**/*.tsx", "**/*.ts"]
---

# Requirements-First Development

Before implementing new user-facing features, ensure requirements are documented.

## When This Applies

This rule applies when:
- Adding new routes or pages
- Creating new UI components with user interaction
- Modifying existing user-facing behavior
- Adding new API endpoints

## Required Analysis

Before proceeding with implementation, analyze:

1. **Is this a new feature?** Check if it adds user-facing functionality
2. **Do requirements exist?** Search `common/scenarios/` for related features/rules/scenarios
3. **Are requirements current?** If existing, do they match the intended change?

## Decision Flow

```
Is this a feature change?
├── No → Proceed (bugfix, docs, chore)
└── Yes → Check requirements in common/scenarios/
          ├── Requirements exist and match → Proceed
          ├── Requirements exist but outdated → Update via /req, then proceed
          └── No requirements → Complete /req workflow first
```

## If Skipping Requirements

If you determine requirements are NOT needed, you must:

1. **Explain why** - Document reasoning
2. **Get confirmation** - Prompt user before proceeding

Examples where skip may be justified:
- Pure refactoring with no behavior change
- Bug fixing existing documented behavior
- Infrastructure/tooling changes
