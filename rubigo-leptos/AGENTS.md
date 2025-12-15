# AGENTS.md

## Overview
This document serves as the **SINGLE SOURCE OF TRUTH** for design rules, UI standards, and coding conventions for all AI agents working on this project.

**Design Philosophy**: Modern, fluid, premium dashboard experience with depth and motion.  
**Target Feel**: Think "Vercel Dashboard meets Linear meets Stripe" — clean, spacious, with subtle delight.

---

## 1. Design Foundations

### 1.1 Design Principles
1. **Depth & Layering**: Use subtle shadows and background variations to create visual hierarchy.
2. **Fluid Motion**: Transitions should feel organic (ease-out curves, 200-400ms duration).
3. **Breathing Room**: Generous whitespace. Never cramped.
4. **Progressive Disclosure**: Show what matters, reveal complexity on demand.
5. **Delight in Details**: Micro-interactions (hover effects, focus rings, loading states) matter.

---

## 2. Color System

### 2.1 Dark Theme (Primary)
This application uses a **dark-first** design optimized for extended use.

```css
:root {
    /* === Base Palette === */
    --color-gray-950: #0a0a0f;      /* Deepest background */
    --color-gray-900: #111118;      /* Primary background */
    --color-gray-850: #16161d;      /* Elevated surfaces */
    --color-gray-800: #1c1c24;      /* Cards, containers */
    --color-gray-700: #2a2a35;      /* Subtle borders, dividers */
    --color-gray-600: #3d3d4a;      /* Disabled states */
    --color-gray-500: #6b6b7a;      /* Placeholder text */
    --color-gray-400: #9898a6;      /* Secondary text */
    --color-gray-300: #c4c4ce;      /* Primary text (muted) */
    --color-gray-100: #f0f0f4;      /* Primary text (bright) */
    --color-white: #ffffff;

    /* === Accent Colors === */
    --color-primary: #6366f1;       /* Indigo - primary actions */
    --color-primary-hover: #818cf8;
    --color-primary-muted: rgba(99, 102, 241, 0.15);
    
    --color-success: #10b981;       /* Emerald - success states */
    --color-success-muted: rgba(16, 185, 129, 0.15);
    
    --color-warning: #f59e0b;       /* Amber - warnings */
    --color-warning-muted: rgba(245, 158, 11, 0.15);
    
    --color-error: #ef4444;         /* Red - errors, destructive */
    --color-error-muted: rgba(239, 68, 68, 0.15);
    
    --color-info: #3b82f6;          /* Blue - informational */
    --color-info-muted: rgba(59, 130, 246, 0.15);

    /* === Semantic Mapping === */
    --bg-body: var(--color-gray-900);
    --bg-elevated: var(--color-gray-850);
    --bg-card: var(--color-gray-800);
    --bg-input: var(--color-gray-850);
    --bg-hover: rgba(255, 255, 255, 0.04);
    --bg-active: rgba(255, 255, 255, 0.08);
    
    --text-primary: var(--color-gray-100);
    --text-secondary: var(--color-gray-400);
    --text-muted: var(--color-gray-500);
    --text-inverse: var(--color-gray-900);
    
    --border-subtle: var(--color-gray-700);
    --border-default: var(--color-gray-600);
    --border-focus: var(--color-primary);
}
```

### 2.2 Color Usage Guidelines
- **Backgrounds**: Use layered grays to create depth. Body → Elevated → Card → Input.
- **Text**: Primary for headings/body. Secondary for labels. Muted for placeholders.
- **Accents**: Primary (indigo) for CTAs. Use sparingly — one accent per section.
- **Status Colors**: Reserved for meaning. Don't use green/red decoratively.

---

## 3. Typography

### 3.1 Font Stack
```css
:root {
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
```

**Required Imports** (in `<head>`):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 3.2 Type Scale
| Role | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| Display | 36px | 700 | 1.1 | -0.02em | Hero sections |
| Heading 1 | 28px | 600 | 1.2 | -0.01em | Page titles |
| Heading 2 | 22px | 600 | 1.25 | -0.01em | Section titles |
| Heading 3 | 18px | 600 | 1.3 | 0 | Card titles |
| Body | 15px | 400 | 1.6 | 0 | Paragraphs, descriptions |
| Body Small | 14px | 400 | 1.5 | 0 | Secondary info |
| Label | 13px | 500 | 1.4 | 0.01em | Form labels, table headers |
| Caption | 12px | 400 | 1.4 | 0.02em | Timestamps, metadata |
| Mono | 13px | 400 | 1.5 | 0 | Code, IDs, technical data |

---

## 4. Spacing & Layout

### 4.1 Spacing Scale (8px Base)
```css
:root {
    --space-1: 4px;    /* Tight: icon gaps */
    --space-2: 8px;    /* Compact: inline elements */
    --space-3: 12px;   /* Default: input padding */
    --space-4: 16px;   /* Standard: card padding */
    --space-5: 20px;   /* Comfortable */
    --space-6: 24px;   /* Section gaps */
    --space-8: 32px;   /* Large gaps */
    --space-10: 40px;  /* Section margins */
    --space-12: 48px;  /* Page margins */
    --space-16: 64px;  /* Major sections */
}
```

### 4.2 Container Widths
```css
:root {
    --container-xs: 320px;   /* Modals, small dialogs */
    --container-sm: 480px;   /* Forms, narrow content */
    --container-md: 768px;   /* Standard content */
    --container-lg: 1024px;  /* Wide content */
    --container-xl: 1280px;  /* Dashboard max-width */
    --container-2xl: 1536px; /* Ultra-wide layouts */
}
```

---

## 5. Responsive Breakpoints

### 5.1 Breakpoint System
| Name | Min Width | Target Devices |
|------|-----------|----------------|
| `xs` | 0 | Mobile portrait (320-479px) |
| `sm` | 480px | Mobile landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small desktops, laptops |
| `xl` | 1280px | Standard desktops |
| `2xl` | 1536px | Large monitors |
| `3xl` | 1920px | Full HD+ |
| `4xl` | 2560px | 2K/5K ultrawide |

```css
/* Mobile First Approach */
@media (min-width: 480px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
@media (min-width: 1920px) { /* 3xl */ }
@media (min-width: 2560px) { /* 4xl */ }
```

### 5.2 Responsive Patterns
- **Mobile (xs-sm)**: Single column, stacked layout, hamburger nav, full-width cards.
- **Tablet (md)**: Two-column grids, collapsed sidebar with toggle, modal forms.
- **Desktop (lg-xl)**: Sidebar navigation, multi-column grids, inline forms.
- **Ultrawide (2xl+)**: Centered max-width container OR multi-panel dashboard.

---

## 6. Elevation & Shadows

### 6.1 Shadow Scale
```css
:root {
    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.25);
    --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.2);
    --shadow-xl: 0 16px 32px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.15);
    
    /* Glow effects for focus/accent */
    --glow-primary: 0 0 0 3px var(--color-primary-muted);
    --glow-error: 0 0 0 3px var(--color-error-muted);
}
```

### 6.2 Elevation Usage
| Level | Shadow | Use Case |
|-------|--------|----------|
| 0 | None | Inline elements, text |
| 1 | `--shadow-xs` | Buttons (resting) |
| 2 | `--shadow-sm` | Cards, inputs |
| 3 | `--shadow-md` | Dropdowns, popovers |
| 4 | `--shadow-lg` | Modals, dialogs |
| 5 | `--shadow-xl` | Notification toasts |

---

## 7. Motion & Animation

### 7.1 Timing Functions
```css
:root {
    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* Primary: exits, reveals */
    --ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);  /* Symmetric movements */
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Playful bounces */
    
    --duration-fast: 150ms;    /* Micro-interactions */
    --duration-normal: 250ms;  /* Standard transitions */
    --duration-slow: 400ms;    /* Complex animations */
    --duration-slower: 600ms;  /* Page transitions */
}
```

### 7.2 Standard Transitions
```css
/* Default for interactive elements */
transition: all var(--duration-normal) var(--ease-out);

/* Specific recommendations */
.button { transition: background-color var(--duration-fast) var(--ease-out), 
                      transform var(--duration-fast) var(--ease-out),
                      box-shadow var(--duration-fast) var(--ease-out); }
.card { transition: transform var(--duration-normal) var(--ease-out),
                    box-shadow var(--duration-normal) var(--ease-out); }
.input { transition: border-color var(--duration-fast) var(--ease-out),
                     box-shadow var(--duration-fast) var(--ease-out); }
```

### 7.3 Hover & Focus Effects
- **Buttons**: Slight lift (`translateY(-1px)`), shadow increase, background lighten.
- **Cards**: Subtle lift (`translateY(-2px)`), shadow increase.
- **Links**: Underline animation or color shift.
- **Inputs**: Focus ring glow (`--glow-primary`), border color change.

---

## 8. Component Specifications

### 8.1 Buttons
```css
.btn {
    height: 40px;
    padding: 0 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out);
}

.btn-primary {
    background: var(--color-primary);
    color: white;
    border: none;
    box-shadow: var(--shadow-xs);
}
.btn-primary:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
}

.btn-secondary {
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-default);
}
.btn-secondary:hover {
    background: var(--bg-hover);
    border-color: var(--text-secondary);
}

.btn-danger {
    background: var(--color-error);
    color: white;
}

.btn-sm { height: 32px; padding: 0 12px; font-size: 13px; }
.btn-lg { height: 48px; padding: 0 28px; font-size: 16px; }
```

### 8.2 Cards
```css
.card {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: var(--space-5);
    box-shadow: var(--shadow-sm);
    transition: transform var(--duration-normal) var(--ease-out),
                box-shadow var(--duration-normal) var(--ease-out);
}
.card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.card-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: var(--space-3);
    color: var(--text-primary);
}
```

### 8.3 Form Inputs
```css
input, select, textarea {
    width: 100%;
    height: 44px;
    padding: 0 var(--space-3);
    background: var(--bg-input);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 15px;
    transition: border-color var(--duration-fast) var(--ease-out),
                box-shadow var(--duration-fast) var(--ease-out);
}

input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: var(--glow-primary);
}

input::placeholder {
    color: var(--text-muted);
}
```

### 8.4 Tables
```css
.data-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
}

.data-table th {
    text-align: left;
    padding: var(--space-3) var(--space-4);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border-subtle);
}

.data-table td {
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border-subtle);
    font-size: 14px;
    color: var(--text-primary);
}

.data-table tr:hover td {
    background: var(--bg-hover);
}
```

### 8.5 Navigation Tabs
```css
.tab-nav {
    display: flex;
    gap: var(--space-1);
    padding: var(--space-2);
    background: var(--bg-elevated);
    border-radius: 10px;
    border: 1px solid var(--border-subtle);
}

.tab-link {
    padding: var(--space-2) var(--space-4);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    text-decoration: none;
    transition: all var(--duration-fast) var(--ease-out);
}

.tab-link:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
}

.tab-link.active {
    color: var(--color-primary);
    background: var(--color-primary-muted);
}
```

---

## 9. Layout Patterns

### 9.1 App Shell
```css
.app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.app-header {
    height: 64px;
    padding: 0 var(--space-6);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border-subtle);
    position: sticky;
    top: 0;
    z-index: 100;
}

.main-content {
    flex: 1;
    padding: var(--space-6);
    max-width: var(--container-xl);
    margin: 0 auto;
    width: 100%;
}

/* Responsive */
@media (max-width: 767px) {
    .app-header { height: 56px; padding: 0 var(--space-4); }
    .main-content { padding: var(--space-4); }
}
```

### 9.2 Grid System
```css
.grid {
    display: grid;
    gap: var(--space-4);
}

.grid-cols-1 { grid-template-columns: 1fr; }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

@media (max-width: 1023px) {
    .grid-cols-3, .grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 767px) {
    .grid-cols-2, .grid-cols-3, .grid-cols-4 { grid-template-columns: 1fr; }
}
```

---

## 10. Icons & Imagery

### 10.1 Icon System
Use **Lucide Icons** or **Heroicons** (outline style, 24px default).

```html
<!-- Example: Lucide via CDN -->
<script src="https://unpkg.com/lucide@latest"></script>
<script>lucide.createIcons();</script>

<!-- Usage -->
<i data-lucide="settings" class="icon"></i>
```

```css
.icon {
    width: 20px;
    height: 20px;
    stroke-width: 1.5;
    color: currentColor;
}
.icon-sm { width: 16px; height: 16px; }
.icon-lg { width: 24px; height: 24px; }
```

---

## 11. Code Quality & Testing Standards

1. **Compiler Safety**: When finishing code, ensure there are **NO** compiler warnings or errors.
2. **UI Tests**: All UI tests must be passing before task completion.
3. **Debugging UI**: 
   - Changing UI tests to make them pass is a **last resort**. 
   - **Permission Required**: You MUST prompt the user for permission before updating/relaxing tests.
   - **Visual Inspection**: If UI tests fail, BEFORE attempting to fix code, you MUST visually inspect the artifacts (screenshots) in `test-results/`.

---

## 12. Implementation Checklist

When creating or updating components, verify:

- [ ] **Colors**: Using CSS variables, not hardcoded values
- [ ] **Typography**: Correct size/weight/spacing from type scale
- [ ] **Spacing**: Multiples of 4/8px using spacing variables
- [ ] **Shadows**: Appropriate elevation level for component type
- [ ] **Transitions**: Smooth, using standard timing functions
- [ ] **Focus States**: Visible focus rings for accessibility
- [ ] **Hover States**: Subtle feedback on interactive elements
- [ ] **Responsive**: Works at all breakpoints (mobile to ultrawide)
- [ ] **Dark Theme**: Proper contrast ratios (4.5:1 minimum for text)
