---
type: presentational
description: Visual divider between content sections
---

# Separator

A visual divider line to separate content sections.

## Design Guidelines

```sudolang
Visual Design:
  Color: border color (--border)
  Thickness: 1px
  
Orientation:
  - horizontal: full width, 1px height, vertical margin
  - vertical: full height, 1px width, horizontal margin

Spacing:
  Default margin: 16px on cross-axis
  Compact margin: 8px on cross-axis

Variants:
  - solid: continuous line
  - dashed: dashed pattern
  - dotted: dotted pattern
```

---

## Accessibility

```sudolang
Role: separator
ARIA attributes:
  - aria-orientation: "horizontal" or "vertical"

Note: Purely decorative, no keyboard interaction
```
