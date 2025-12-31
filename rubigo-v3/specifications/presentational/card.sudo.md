---
type: presentational
description: Container with border, padding, and rounded corners
---

# Card

A styled container for grouping related content with visual separation.

## Design Guidelines

```sudolang
Visual Design:
  Background: surface color (--bg-secondary)
  Border: 1px solid border color (--border)
  Border radius: 8px
  Padding: 16px

Variants:
  - default: standard border and background
  - elevated: subtle box-shadow for depth
  - outlined: transparent background, visible border

Slots:
  - header: optional header section
  - content: main content area (required)
  - footer: optional footer section

Responsive Behavior:
  Stack header/content/footer vertically
  Padding adjusts for mobile (12px)
```

---

## Accessibility

```sudolang
Role: region (when has heading) or group
ARIA attributes:
  - aria-labelledby: ID of header element when present

Focus Management:
  - Card itself should not be focusable
  - Interactive children handle their own focus
```

---

## Example Usages

```tsx example="basic"
<Card>
  <Card.Header>
    <Card.Title>Card Title</Card.Title>
    <Card.Description>Card description text.</Card.Description>
  </Card.Header>
  <Card.Content>
    <p>Main content goes here.</p>
  </Card.Content>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>
```
