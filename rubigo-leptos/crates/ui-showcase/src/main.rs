//! UI Showcase - Storybook-style Component Explorer
//!
//! Interactive documentation and exploration for ui-core components

use leptos::prelude::*;
use ui_core::elements::*;
use ui_core::primitives::*;

fn main() {
    console_error_panic_hook::set_once();
    _ = console_log::init_with_level(log::Level::Debug);

    mount_to_body(App);
}

/// Component metadata for documentation
#[allow(dead_code)]
struct ComponentMeta {
    name: &'static str,
    description: &'static str,
    category: &'static str,
}

const COMPONENTS: &[ComponentMeta] = &[
    // Global
    ComponentMeta {
        name: "Design Tokens",
        description: "CSS custom properties and design system foundations",
        category: "Global",
    },
    // Primitives
    ComponentMeta {
        name: "Button",
        description: "Interactive button with variants, sizes, and states",
        category: "Primitives",
    },
    ComponentMeta {
        name: "Input",
        description: "Text input with two-way binding and validation",
        category: "Primitives",
    },
    ComponentMeta {
        name: "Select",
        description: "Dropdown select with options and two-way binding",
        category: "Primitives",
    },
    ComponentMeta {
        name: "DateInput",
        description: "Date picker with Today button",
        category: "Primitives",
    },
    ComponentMeta {
        name: "TimeInput",
        description: "Time picker with step intervals",
        category: "Primitives",
    },
    ComponentMeta {
        name: "Badge",
        description: "Status indicator pill with semantic variants",
        category: "Primitives",
    },
    ComponentMeta {
        name: "Checkbox",
        description: "Boolean toggle with optional label",
        category: "Primitives",
    },
    ComponentMeta {
        name: "Icon",
        description: "SVG icon wrapper with consistent sizing",
        category: "Primitives",
    },
    // Elements (L1)
    ComponentMeta {
        name: "Card",
        description: "Container with header, body, and optional footer",
        category: "Elements",
    },
    ComponentMeta {
        name: "Table",
        description: "Data table with sortable columns and row selection",
        category: "Elements",
    },
    ComponentMeta {
        name: "Modal",
        description: "Overlay dialog with backdrop and focus trap",
        category: "Elements",
    },
    ComponentMeta {
        name: "Tabs",
        description: "Tabbed navigation with animated indicator",
        category: "Elements",
    },
    ComponentMeta {
        name: "SlidePanel",
        description: "Slide-in panel from right with blur backdrop",
        category: "Elements",
    },
    ComponentMeta {
        name: "Avatar",
        description: "Photo with fallback initials",
        category: "Primitives",
    },
    ComponentMeta {
        name: "SearchInput",
        description: "Search input with icon and placeholder",
        category: "Primitives",
    },
    ComponentMeta {
        name: "FilterDropdown",
        description: "Dropdown select for filtering lists",
        category: "Elements",
    },
    ComponentMeta {
        name: "Pagination",
        description: "Table pagination controls with page size selector",
        category: "Elements",
    },
    ComponentMeta {
        name: "DataTable",
        description: "Generic data table with column definitions",
        category: "Elements",
    },
];

#[component]
fn App() -> impl IntoView {
    let active_component = RwSignal::new("Button".to_string());

    view! {
        <div class="showcase-app">
            <Sidebar active=active_component />
            <main class="showcase-main">
                <ComponentView active=active_component />
            </main>
        </div>
    }
}

#[component]
fn Sidebar(active: RwSignal<String>) -> impl IntoView {
    let categories = ["Global", "Primitives", "Elements"];

    view! {
        <aside class="showcase-sidebar">
            <div class="sidebar-header">
                <h1>"UI Core"</h1>
                <span class="version">"v0.1.0"</span>
            </div>

            <nav class="sidebar-nav">
                {categories.iter().map(|category| {
                    let cat = *category;
                    view! {
                        <div class="nav-section">
                            <h2>{cat}</h2>
                            <ul>
                                {COMPONENTS.iter().filter(|c| c.category == cat).map(|comp| {
                                    let name = comp.name.to_string();
                                    let name_clone = name.clone();
                                    view! {
                                        <li
                                            class:active=move || active.get() == name
                                            on:click=move |_| active.set(name_clone.clone())
                                        >
                                            {comp.name}
                                        </li>
                                    }
                                }).collect::<Vec<_>>()}
                            </ul>
                        </div>
                    }
                }).collect::<Vec<_>>()}
            </nav>

            <div class="sidebar-footer">
                <a href="https://leptos.dev" target="_blank">"Built with Leptos"</a>
            </div>
        </aside>
    }
}

#[component]
fn ComponentView(active: RwSignal<String>) -> impl IntoView {
    view! {
        <div class="component-view">
            {move || {
                let component = active.get();
                match component.as_str() {
                    // Global
                    "Design Tokens" => view! { <DesignTokensDocs /> }.into_any(),
                    // Primitives
                    "Button" => view! { <ButtonDocs /> }.into_any(),
                    "Input" => view! { <InputDocs /> }.into_any(),
                    "Select" => view! { <SelectDocs /> }.into_any(),
                    "DateInput" => view! { <DateInputDocs /> }.into_any(),
                    "TimeInput" => view! { <TimeInputDocs /> }.into_any(),
                    "Badge" => view! { <BadgeDocs /> }.into_any(),
                    "Checkbox" => view! { <CheckboxDocs /> }.into_any(),
                    "Icon" => view! { <IconDocs /> }.into_any(),
                    // Elements
                    "Card" => view! { <CardDocs /> }.into_any(),
                    "Table" => view! { <TableDocs /> }.into_any(),
                    "Modal" => view! { <ModalDocs /> }.into_any(),
                    "Tabs" => view! { <TabsDocs /> }.into_any(),
                    "SlidePanel" => view! { <SlidePanelDocs /> }.into_any(),
                    "Avatar" => view! { <AvatarDocs /> }.into_any(),
                    "SearchInput" => view! { <SearchInputDocs /> }.into_any(),
                    "FilterDropdown" => view! { <FilterDropdownDocs /> }.into_any(),
                    "Pagination" => view! { <PaginationDocs /> }.into_any(),
                    "DataTable" => view! { <DataTableDocs /> }.into_any(),
                    _ => view! { <p>"Select a component"</p> }.into_any(),
                }
            }}
        </div>
    }
}

// ============================================================================
// BUTTON DOCUMENTATION
// ============================================================================

#[component]
fn ButtonDocs() -> impl IntoView {
    // Interactive controls state
    let variant = RwSignal::new("Primary".to_string());
    let size = RwSignal::new("Medium".to_string());
    let disabled = RwSignal::new(false);
    let loading = RwSignal::new(false);
    let label = RwSignal::new("Click me".to_string());

    view! {
        <article class="component-docs">
            <header class="docs-header">
                <h1>"Button"</h1>
                <p class="description">"Interactive button with variants, sizes, and loading states."</p>
            </header>

            // Live Preview
            <section class="docs-section">
                <h2>"Preview"</h2>
                <div class="preview-container">
                    <div class="preview-area">
                        {move || {
                            let v = match variant.get().as_str() {
                                "Secondary" => ButtonVariant::Secondary,
                                "Danger" => ButtonVariant::Danger,
                                "Ghost" => ButtonVariant::Ghost,
                                _ => ButtonVariant::Primary,
                            };
                            let s = match size.get().as_str() {
                                "Small" => ButtonSize::Small,
                                "Large" => ButtonSize::Large,
                                _ => ButtonSize::Medium,
                            };
                            view! {
                                <Button
                                    variant=v
                                    size=s
                                    disabled=disabled.get()
                                    loading=loading.get()
                                >
                                    {label.get()}
                                </Button>
                            }
                        }}
                    </div>
                </div>
            </section>

            // Controls
            <section class="docs-section">
                <h2>"Controls"</h2>
                <div class="controls-panel">
                    <ControlRow label="Label">
                        <input
                            type="text"
                            class="control-input"
                            prop:value=move || label.get()
                            on:input=move |ev| label.set(event_target_value(&ev))
                        />
                    </ControlRow>

                    <ControlRow label="Variant">
                        <select
                            class="control-select"
                            on:change=move |ev| variant.set(event_target_value(&ev))
                        >
                            <option selected=move || variant.get() == "Primary">"Primary"</option>
                            <option selected=move || variant.get() == "Secondary">"Secondary"</option>
                            <option selected=move || variant.get() == "Danger">"Danger"</option>
                            <option selected=move || variant.get() == "Ghost">"Ghost"</option>
                        </select>
                    </ControlRow>

                    <ControlRow label="Size">
                        <select
                            class="control-select"
                            on:change=move |ev| size.set(event_target_value(&ev))
                        >
                            <option>"Small"</option>
                            <option selected>"Medium"</option>
                            <option>"Large"</option>
                        </select>
                    </ControlRow>

                    <ControlRow label="Disabled">
                        <Checkbox checked=disabled />
                    </ControlRow>

                    <ControlRow label="Loading">
                        <Checkbox checked=loading />
                    </ControlRow>
                </div>
            </section>

            // Props Table
            <section class="docs-section">
                <h2>"Props"</h2>
                <PropsTable props=vec![
                    PropInfo { name: "variant", prop_type: "ButtonVariant", default: "Primary", description: "Visual style variant" },
                    PropInfo { name: "size", prop_type: "ButtonSize", default: "Medium", description: "Button size" },
                    PropInfo { name: "disabled", prop_type: "bool", default: "false", description: "Disables interaction" },
                    PropInfo { name: "loading", prop_type: "bool", default: "false", description: "Shows loading spinner" },
                    PropInfo { name: "on_click", prop_type: "Option<Callback<MouseEvent>>", default: "None", description: "Click handler" },
                    PropInfo { name: "children", prop_type: "Children", default: "-", description: "Button content" },
                ] />
            </section>

            // Variants showcase
            <section class="docs-section">
                <h2>"All Variants"</h2>
                <div class="variant-grid">
                    <div class="variant-item">
                        <Button variant=ButtonVariant::Primary>"Primary"</Button>
                        <code>"ButtonVariant::Primary"</code>
                    </div>
                    <div class="variant-item">
                        <Button variant=ButtonVariant::Secondary>"Secondary"</Button>
                        <code>"ButtonVariant::Secondary"</code>
                    </div>
                    <div class="variant-item">
                        <Button variant=ButtonVariant::Danger>"Danger"</Button>
                        <code>"ButtonVariant::Danger"</code>
                    </div>
                    <div class="variant-item">
                        <Button variant=ButtonVariant::Ghost>"Ghost"</Button>
                        <code>"ButtonVariant::Ghost"</code>
                    </div>
                </div>
            </section>
        </article>
    }
}

// ============================================================================
// INPUT DOCUMENTATION
// ============================================================================

#[component]
fn InputDocs() -> impl IntoView {
    let value = RwSignal::new(String::new());
    let input_type = RwSignal::new("Text".to_string());
    let _placeholder = RwSignal::new("Enter text...".to_string());
    let disabled = RwSignal::new(false);
    let has_error = RwSignal::new(false);

    view! {
        <article class="component-docs">
            <header class="docs-header">
                <h1>"Input"</h1>
                <p class="description">"Text input with two-way binding and validation states."</p>
            </header>

            <section class="docs-section">
                <h2>"Preview"</h2>
                <div class="preview-container">
                    <div class="preview-area" style="max-width: 400px;">
                        {move || {
                            let t = match input_type.get().as_str() {
                                "Password" => InputType::Password,
                                "Email" => InputType::Email,
                                "Number" => InputType::Number,
                                "Search" => InputType::Search,
                                _ => InputType::Text,
                            };
                            let err = if has_error.get() {
                                Some("Validation error".to_string())
                            } else {
                                None
                            };
                            // Need to create placeholder as static str workaround
                            view! {
                                <Input
                                    value=value
                                    input_type=t
                                    disabled=disabled.get()
                                    error=err.unwrap_or_default()
                                    placeholder="Enter text..."
                                />
                            }
                        }}
                    </div>
                    <p class="preview-value">"Value: " {move || format!("\"{}\"", value.get())}</p>
                </div>
            </section>

            <section class="docs-section">
                <h2>"Controls"</h2>
                <div class="controls-panel">
                    <ControlRow label="Type">
                        <select
                            class="control-select"
                            on:change=move |ev| input_type.set(event_target_value(&ev))
                        >
                            <option>"Text"</option>
                            <option>"Password"</option>
                            <option>"Email"</option>
                            <option>"Number"</option>
                            <option>"Search"</option>
                        </select>
                    </ControlRow>

                    <ControlRow label="Disabled">
                        <Checkbox checked=disabled />
                    </ControlRow>

                    <ControlRow label="Has Error">
                        <Checkbox checked=has_error />
                    </ControlRow>
                </div>
            </section>

            <section class="docs-section">
                <h2>"Props"</h2>
                <PropsTable props=vec![
                    PropInfo { name: "value", prop_type: "RwSignal<String>", default: "-", description: "Two-way binding signal" },
                    PropInfo { name: "input_type", prop_type: "InputType", default: "Text", description: "HTML input type" },
                    PropInfo { name: "size", prop_type: "InputSize", default: "Medium", description: "Input size" },
                    PropInfo { name: "placeholder", prop_type: "&'static str", default: "\"\"", description: "Placeholder text" },
                    PropInfo { name: "disabled", prop_type: "bool", default: "false", description: "Disables input" },
                    PropInfo { name: "error", prop_type: "Option<String>", default: "None", description: "Error message" },
                ] />
            </section>
        </article>
    }
}

// ============================================================================
// SELECT DOCUMENTATION
// ============================================================================

#[component]
fn SelectDocs() -> impl IntoView {
    let selected = RwSignal::new("option1".to_string());
    let options = vec![
        SelectOption::new("option1", "Option 1"),
        SelectOption::new("option2", "Option 2"),
        SelectOption::new("option3", "Option 3"),
    ];

    view! {
        <article class="component-docs">
            <header class="docs-header">
                <h1>"Select"</h1>
                <p class="description">"Dropdown select input with two-way binding."</p>
            </header>

            <section class="docs-section">
                <h2>"Example"</h2>
                <div class="preview">
                    <Select value=selected options=options.clone() label="Choose an option".to_string() />
                </div>
                <p>"Selected: " {move || selected.get()}</p>
            </section>
        </article>
    }
}

// ============================================================================
// DATEINPUT DOCUMENTATION
// ============================================================================

#[component]
fn DateInputDocs() -> impl IntoView {
    let date = RwSignal::new("2024-12-12".to_string());

    view! {
        <article class="component-docs">
            <header class="docs-header">
                <h1>"DateInput"</h1>
                <p class="description">"Date picker with Today button."</p>
            </header>

            <section class="docs-section">
                <h2>"Example"</h2>
                <div class="preview" style="max-width: 300px">
                    <DateInput value=date label="Event Date".to_string() />
                </div>
                <p>"Selected date: " {move || date.get()}</p>
            </section>
        </article>
    }
}

// ============================================================================
// TIMEINPUT DOCUMENTATION
// ============================================================================

#[component]
fn TimeInputDocs() -> impl IntoView {
    let time = RwSignal::new("09:00".to_string());

    view! {
        <article class="component-docs">
            <header class="docs-header">
                <h1>"TimeInput"</h1>
                <p class="description">"Time picker with step intervals."</p>
            </header>

            <section class="docs-section">
                <h2>"Example"</h2>
                <div class="preview" style="max-width: 200px">
                    <TimeInput value=time label="Start Time".to_string() />
                </div>
                <p>"Selected time: " {move || time.get()}</p>
            </section>
        </article>
    }
}

// ============================================================================
// BADGE DOCUMENTATION
// ============================================================================

#[component]
fn BadgeDocs() -> impl IntoView {
    view! {
        <article class="component-docs">
            <header class="docs-header">
                <h1>"Badge"</h1>
                <p class="description">"Status indicator pill with semantic color variants."</p>
            </header>

            <section class="docs-section">
                <h2>"All Variants"</h2>
                <div class="variant-grid">
                    <div class="variant-item">
                        <Badge>"Default"</Badge>
                        <code>"BadgeVariant::Default"</code>
                    </div>
                    <div class="variant-item">
                        <Badge variant=BadgeVariant::Primary>"Primary"</Badge>
                        <code>"BadgeVariant::Primary"</code>
                    </div>
                    <div class="variant-item">
                        <Badge variant=BadgeVariant::Success>"Success"</Badge>
                        <code>"BadgeVariant::Success"</code>
                    </div>
                    <div class="variant-item">
                        <Badge variant=BadgeVariant::Warning>"Warning"</Badge>
                        <code>"BadgeVariant::Warning"</code>
                    </div>
                    <div class="variant-item">
                        <Badge variant=BadgeVariant::Error>"Error"</Badge>
                        <code>"BadgeVariant::Error"</code>
                    </div>
                </div>
            </section>

            <section class="docs-section">
                <h2>"Sizes"</h2>
                <div class="preview-row">
                    <Badge size=BadgeSize::Small>"Small"</Badge>
                    <Badge size=BadgeSize::Medium>"Medium"</Badge>
                    <Badge size=BadgeSize::Large>"Large"</Badge>
                </div>
            </section>

            <section class="docs-section">
                <h2>"Props"</h2>
                <PropsTable props=vec![
                    PropInfo { name: "variant", prop_type: "BadgeVariant", default: "Default", description: "Semantic color variant" },
                    PropInfo { name: "size", prop_type: "BadgeSize", default: "Medium", description: "Badge size" },
                    PropInfo { name: "children", prop_type: "Children", default: "-", description: "Badge content" },
                ] />
            </section>
        </article>
    }
}

// ============================================================================
// CHECKBOX DOCUMENTATION
// ============================================================================

#[component]
fn CheckboxDocs() -> impl IntoView {
    let checked = RwSignal::new(false);
    let disabled = RwSignal::new(false);

    view! {
        <article class="component-docs">
            <header class="docs-header">
                <h1>"Checkbox"</h1>
                <p class="description">"Boolean toggle with reactive state and optional label."</p>
            </header>

            <section class="docs-section">
                <h2>"Preview"</h2>
                <div class="preview-container">
                    <div class="preview-area">
                        <Checkbox
                            checked=checked
                            label="Example checkbox"
                            disabled=disabled.get()
                        />
                    </div>
                    <p class="preview-value">"Checked: " {move || checked.get().to_string()}</p>
                </div>
            </section>

            <section class="docs-section">
                <h2>"Controls"</h2>
                <div class="controls-panel">
                    <ControlRow label="Disabled">
                        <Checkbox checked=disabled />
                    </ControlRow>
                </div>
            </section>

            <section class="docs-section">
                <h2>"Props"</h2>
                <PropsTable props=vec![
                    PropInfo { name: "checked", prop_type: "RwSignal<bool>", default: "-", description: "Checked state signal" },
                    PropInfo { name: "label", prop_type: "&'static str", default: "\"\"", description: "Label text" },
                    PropInfo { name: "disabled", prop_type: "bool", default: "false", description: "Disables checkbox" },
                    PropInfo { name: "on_change", prop_type: "Option<Callback<bool>>", default: "None", description: "Change handler" },
                ] />
            </section>
        </article>
    }
}

// ============================================================================
// ICON DOCUMENTATION
// ============================================================================

#[component]
fn IconDocs() -> impl IntoView {
    view! {
        <article class="component-docs">
            <header class="docs-header">
                <h1>"Icon"</h1>
                <p class="description">"SVG icon wrapper with consistent sizing."</p>
            </header>

            <section class="docs-section">
                <h2>"Sizes"</h2>
                <div class="preview-row" style="gap: 24px;">
                    <div class="icon-demo">
                        <Icon name="example" size=IconSize::Small>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                        </Icon>
                        <span>"Small"</span>
                    </div>
                    <div class="icon-demo">
                        <Icon name="example" size=IconSize::Medium>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                        </Icon>
                        <span>"Medium"</span>
                    </div>
                    <div class="icon-demo">
                        <Icon name="example" size=IconSize::Large>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                        </Icon>
                        <span>"Large"</span>
                    </div>
                    <div class="icon-demo">
                        <Icon name="example" size=IconSize::XLarge>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                        </Icon>
                        <span>"XLarge"</span>
                    </div>
                </div>
            </section>

            <section class="docs-section">
                <h2>"Props"</h2>
                <PropsTable props=vec![
                    PropInfo { name: "name", prop_type: "&'static str", default: "-", description: "Icon name for aria-label" },
                    PropInfo { name: "size", prop_type: "IconSize", default: "Medium", description: "Icon size" },
                    PropInfo { name: "class", prop_type: "&'static str", default: "\"\"", description: "Additional CSS class" },
                    PropInfo { name: "children", prop_type: "Option<Children>", default: "None", description: "SVG content" },
                ] />
            </section>
        </article>
    }
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

struct PropInfo {
    name: &'static str,
    prop_type: &'static str,
    default: &'static str,
    description: &'static str,
}

#[component]
fn PropsTable(props: Vec<PropInfo>) -> impl IntoView {
    view! {
        <table class="props-table">
            <thead>
                <tr>
                    <th>"Name"</th>
                    <th>"Type"</th>
                    <th>"Default"</th>
                    <th>"Description"</th>
                </tr>
            </thead>
            <tbody>
                {props.into_iter().map(|p| view! {
                    <tr>
                        <td><code>{p.name}</code></td>
                        <td><code class="type">{p.prop_type}</code></td>
                        <td><code class="default">{p.default}</code></td>
                        <td>{p.description}</td>
                    </tr>
                }).collect::<Vec<_>>()}
            </tbody>
        </table>
    }
}

#[component]
fn ControlRow(label: &'static str, children: Children) -> impl IntoView {
    view! {
        <div class="control-row">
            <label class="control-label">{label}</label>
            <div class="control-value">
                {children()}
            </div>
        </div>
    }
}

// ============================================================================
// DESIGN TOKENS DOCUMENTATION
// ============================================================================

#[component]
fn DesignTokensDocs() -> impl IntoView {
    view! {
        <article class="component-docs">
            <header class="docs-header">
                <h1>"Design Tokens"</h1>
                <p class="description">"CSS custom properties that define the design system foundations."</p>
            </header>

            // Background Colors
            <section class="docs-section">
                <h2>"Background Colors"</h2>
                <div class="token-grid">
                    <div class="token-item">
                        <div class="color-swatch" style="background: #0f0f14; border: 1px solid #3d3d4a;"></div>
                        <code>"--bg-base"</code>
                        <span>"#0f0f14"</span>
                    </div>
                    <div class="token-item">
                        <div class="color-swatch" style="background: #1a1a23; border: 1px solid #3d3d4a;"></div>
                        <code>"--bg-surface"</code>
                        <span>"#1a1a23"</span>
                    </div>
                    <div class="token-item">
                        <div class="color-swatch" style="background: #232330; border: 1px solid #3d3d4a;"></div>
                        <code>"--bg-elevated"</code>
                        <span>"#232330"</span>
                    </div>
                </div>
            </section>

            // Semantic Colors
            <section class="docs-section">
                <h2>"Semantic Colors"</h2>
                <div class="token-grid">
                    <div class="token-item">
                        <div class="color-swatch" style="background: #6366f1;"></div>
                        <code>"--color-primary"</code>
                        <span>"#6366f1"</span>
                    </div>
                    <div class="token-item">
                        <div class="color-swatch" style="background: #818cf8;"></div>
                        <code>"--color-primary-hover"</code>
                        <span>"#818cf8"</span>
                    </div>
                    <div class="token-item">
                        <div class="color-swatch" style="background: #10b981;"></div>
                        <code>"--color-success"</code>
                        <span>"#10b981"</span>
                    </div>
                    <div class="token-item">
                        <div class="color-swatch" style="background: #f59e0b;"></div>
                        <code>"--color-warning"</code>
                        <span>"#f59e0b"</span>
                    </div>
                    <div class="token-item">
                        <div class="color-swatch" style="background: #ef4444;"></div>
                        <code>"--color-error"</code>
                        <span>"#ef4444"</span>
                    </div>
                </div>
            </section>

            // Text Colors
            <section class="docs-section">
                <h2>"Text Colors"</h2>
                <div class="token-list">
                    <div class="token-row">
                        <code>"--text-primary"</code>
                        <div class="color-indicator" style="background: #f0f0f4;"></div>
                        <span style="color: #f0f0f4;">"Primary text - #f0f0f4"</span>
                    </div>
                    <div class="token-row">
                        <code>"--text-secondary"</code>
                        <div class="color-indicator" style="background: #9898a6;"></div>
                        <span style="color: #9898a6;">"Secondary text - #9898a6"</span>
                    </div>
                    <div class="token-row">
                        <code>"--text-tertiary"</code>
                        <div class="color-indicator" style="background: #6b6b7a;"></div>
                        <span style="color: #6b6b7a;">"Tertiary text - #6b6b7a"</span>
                    </div>
                </div>
            </section>

            // Border Colors
            <section class="docs-section">
                <h2>"Border Colors"</h2>
                <div class="token-list">
                    <div class="token-row">
                        <code>"--border-default"</code>
                        <div class="color-indicator" style="background: #3d3d4a;"></div>
                        <span>"Default border - #3d3d4a"</span>
                    </div>
                    <div class="token-row">
                        <code>"--border-subtle"</code>
                        <div class="color-indicator" style="background: #2d2d3a;"></div>
                        <span>"Subtle border - #2d2d3a"</span>
                    </div>
                </div>
            </section>

            // Typography
            <section class="docs-section">
                <h2>"Typography"</h2>
                <div class="token-list">
                    <div class="token-row">
                        <code>"--font-sans"</code>
                        <span style="font-family: Inter, -apple-system, sans-serif;">"Inter, -apple-system, sans-serif"</span>
                    </div>
                    <div class="token-row">
                        <code>"--font-mono"</code>
                        <span style="font-family: 'Fira Code', monospace;">"Fira Code, SF Mono, monospace"</span>
                    </div>
                </div>
            </section>

            // Border Radius
            <section class="docs-section">
                <h2>"Border Radius"</h2>
                <div class="token-list">
                    <div class="token-row">
                        <code>"--radius-sm"</code>
                        <div class="radius-demo" style="border-radius: 4px;"></div>
                        <span>"4px"</span>
                    </div>
                    <div class="token-row">
                        <code>"--radius-md"</code>
                        <div class="radius-demo" style="border-radius: 8px;"></div>
                        <span>"8px"</span>
                    </div>
                    <div class="token-row">
                        <code>"--radius-lg"</code>
                        <div class="radius-demo" style="border-radius: 12px;"></div>
                        <span>"12px"</span>
                    </div>
                    <div class="token-row">
                        <code>"--radius-full"</code>
                        <div class="radius-demo" style="border-radius: 9999px;"></div>
                        <span>"9999px"</span>
                    </div>
                </div>
            </section>

            // Shadows
            <section class="docs-section">
                <h2>"Shadows"</h2>
                <div class="shadow-demos">
                    <div class="shadow-demo" style="box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);">
                        <code>"--shadow-xs"</code>
                    </div>
                    <div class="shadow-demo" style="box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);">
                        <code>"--shadow-sm"</code>
                    </div>
                    <div class="shadow-demo" style="box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
                        <code>"--shadow-md"</code>
                    </div>
                </div>
            </section>

            // Animation
            <section class="docs-section">
                <h2>"Animation"</h2>
                <div class="token-list">
                    <div class="token-row">
                        <code>"--duration-fast"</code>
                        <span>"150ms"</span>
                    </div>
                    <div class="token-row">
                        <code>"--ease-out"</code>
                        <span>"cubic-bezier(0.16, 1, 0.3, 1)"</span>
                    </div>
                </div>
            </section>
        </article>
    }
}

// ============================================================================
// CARD DOCUMENTATION
// ============================================================================

#[component]
fn CardDocs() -> impl IntoView {
    view! {
        <article class="component-docs">
            <header class="docs-header">
                <h1>"Card"</h1>
                <p class="description">"Container component with optional title, subtitle, and footer."</p>
            </header>

            <section class="docs-section">
                <h2>"Preview"</h2>
                <div class="preview-container" style="max-width: 400px;">
                    <Card
                        title="Card Title"
                        subtitle="Optional subtitle text"
                    >
                        <p>"This is the card body content. Cards are useful for grouping related information."</p>
                    </Card>
                </div>
            </section>

            <section class="docs-section">
                <h2>"Variants"</h2>
                <div class="card-grid">
                    <Card>
                        <p>"Simple card with body only"</p>
                    </Card>
                    <Card title="With Title">
                        <p>"Card with title and body"</p>
                    </Card>
                    <Card variant=CardVariant::Elevated title="Elevated">
                        <p>"Card with shadow"</p>
                    </Card>
                </div>
            </section>

            <section class="docs-section">
                <h2>"Props"</h2>
                <PropsTable props=vec![
                    PropInfo { name: "title", prop_type: "Option<String>", default: "None", description: "Card title" },
                    PropInfo { name: "subtitle", prop_type: "Option<String>", default: "None", description: "Subtitle below title" },
                    PropInfo { name: "variant", prop_type: "CardVariant", default: "Default", description: "Visual style" },
                    PropInfo { name: "footer", prop_type: "Option<Children>", default: "None", description: "Footer content" },
                    PropInfo { name: "children", prop_type: "Children", default: "-", description: "Main content" },
                ] />
            </section>
        </article>
    }
}

// ============================================================================
// TABLE DOCUMENTATION
// ============================================================================

#[component]
fn TableDocs() -> impl IntoView {
    use std::collections::HashMap;

    // Sample data
    let columns = vec![
        TableColumn::new("name", "Name"),
        TableColumn::new("status", "Status"),
        TableColumn::new("role", "Role"),
    ];

    let data: Vec<HashMap<String, String>> = vec![
        [
            ("name".to_string(), "Alice Johnson".to_string()),
            ("status".to_string(), "Active".to_string()),
            ("role".to_string(), "Engineer".to_string()),
        ]
        .into_iter()
        .collect(),
        [
            ("name".to_string(), "Bob Smith".to_string()),
            ("status".to_string(), "Away".to_string()),
            ("role".to_string(), "Designer".to_string()),
        ]
        .into_iter()
        .collect(),
        [
            ("name".to_string(), "Carol Williams".to_string()),
            ("status".to_string(), "Offline".to_string()),
            ("role".to_string(), "Manager".to_string()),
        ]
        .into_iter()
        .collect(),
    ];

    view! {
        <article class="component-docs">
            <header class="docs-header">
                <h1>"Table"</h1>
                <p class="description">"Data table component with columns and row data."</p>
            </header>

            <section class="docs-section">
                <h2>"Preview"</h2>
                <div class="preview-container">
                    <Table
                        columns=columns
                        data=data
                    />
                </div>
            </section>

            <section class="docs-section">
                <h2>"Props"</h2>
                <PropsTable props=vec![
                    PropInfo { name: "columns", prop_type: "Vec<TableColumn>", default: "-", description: "Column definitions" },
                    PropInfo { name: "data", prop_type: "Vec<HashMap<String, String>>", default: "-", description: "Row data keyed by column" },
                    PropInfo { name: "variant", prop_type: "TableVariant", default: "Default", description: "Visual style (Compact, Striped)" },
                    PropInfo { name: "empty_message", prop_type: "&'static str", default: "No data", description: "Empty state text" },
                    PropInfo { name: "on_row_click", prop_type: "Option<Callback<usize>>", default: "None", description: "Row click handler" },
                ] />
            </section>
        </article>
    }
}

// ============================================================================
// MODAL DOCUMENTATION
// ============================================================================

#[component]
fn ModalDocs() -> impl IntoView {
    let show_modal = RwSignal::new(false);

    view! {
        <article class="component-docs">
            <header class="docs-header">
                <h1>"Modal"</h1>
                <p class="description">"Overlay dialog with backdrop for focused interactions."</p>
            </header>

            <section class="docs-section">
                <h2>"Preview"</h2>
                <div class="preview-container">
                    <Button on_click=Callback::new(move |_| show_modal.set(true))>
                        "Open Modal"
                    </Button>

                    <Modal
                        open=show_modal
                        title="Confirm Action"
                    >
                        <p>"This is the modal content. Click the X or backdrop to close."</p>
                    </Modal>
                </div>
            </section>

            <section class="docs-section">
                <h2>"Props"</h2>
                <PropsTable props=vec![
                    PropInfo { name: "open", prop_type: "RwSignal<bool>", default: "-", description: "Controls visibility" },
                    PropInfo { name: "title", prop_type: "Option<String>", default: "None", description: "Modal title" },
                    PropInfo { name: "size", prop_type: "ModalSize", default: "Medium", description: "Size variant" },
                    PropInfo { name: "children", prop_type: "Children", default: "-", description: "Modal content" },
                ] />
            </section>
        </article>
    }
}

// ============================================================================
// TABS DOCUMENTATION
// ============================================================================

#[component]
fn TabsDocs() -> impl IntoView {
    let active_tab = RwSignal::new("overview".to_string());

    let tabs = vec![
        TabItem::new("overview", "Overview"),
        TabItem::new("details", "Details"),
        TabItem::new("settings", "Settings").icon("⚙️"),
    ];

    view! {
        <article class="component-docs">
            <header class="docs-header">
                <h1>"Tabs"</h1>
                <p class="description">"Tabbed navigation for switching between content panels."</p>
            </header>

            <section class="docs-section">
                <h2>"Preview"</h2>
                <div class="preview-container">
                    <Tabs items=tabs active_tab=active_tab />

                    <div class="tab-content" style="padding: 16px; background: var(--bg-surface); border-radius: 0 0 8px 8px;">
                        {move || match active_tab.get().as_str() {
                            "overview" => view! { <p>"Overview content goes here."</p> }.into_any(),
                            "details" => view! { <p>"Details content goes here."</p> }.into_any(),
                            "settings" => view! { <p>"Settings content goes here."</p> }.into_any(),
                            _ => view! { <p>"Select a tab"</p> }.into_any(),
                        }}
                    </div>
                </div>
            </section>

            <section class="docs-section">
                <h2>"Props"</h2>
                <PropsTable props=vec![
                    PropInfo { name: "items", prop_type: "Vec<TabItem>", default: "-", description: "Tab definitions" },
                    PropInfo { name: "active_tab", prop_type: "RwSignal<String>", default: "-", description: "Currently active tab ID" },
                    PropInfo { name: "variant", prop_type: "TabsVariant", default: "Underline", description: "Visual style" },
                    PropInfo { name: "on_change", prop_type: "Option<Callback<String>>", default: "None", description: "Change handler" },
                ] />
            </section>
        </article>
    }
}

// ============================================================================
// SLIDE PANEL DOCUMENTATION
// ============================================================================

#[component]
fn SlidePanelDocs() -> impl IntoView {
    let show_small = RwSignal::new(false);
    let show_medium = RwSignal::new(false);
    let show_large = RwSignal::new(false);
    let show_xlarge = RwSignal::new(false);

    view! {
        <article class="component-docs">
            <header class="docs-header">
                <h1>"SlidePanel"</h1>
                <p class="description">"Slide-in panel from the right with blur backdrop for details views."</p>
            </header>

            <section class="docs-section">
                <h2>"Size Variants"</h2>
                <div class="preview-container" style="padding: 24px;">
                    <div class="preview-row">
                        <Button
                            variant=ButtonVariant::Secondary
                            on_click=Callback::new(move |_| show_small.set(true))
                        >
                            "Small (360px)"
                        </Button>
                        <Button
                            on_click=Callback::new(move |_| show_medium.set(true))
                        >
                            "Medium (480px)"
                        </Button>
                        <Button
                            variant=ButtonVariant::Secondary
                            on_click=Callback::new(move |_| show_large.set(true))
                        >
                            "Large (600px)"
                        </Button>
                        <Button
                            variant=ButtonVariant::Secondary
                            on_click=Callback::new(move |_| show_xlarge.set(true))
                        >
                            "XLarge (800px)"
                        </Button>
                    </div>

                    // Small panel
                    <SlidePanel
                        open=show_small
                        title="Small Panel"
                        size=PanelSize::Small
                    >
                        <p>"This is a small (360px) panel."</p>
                        <p style="margin-top: 12px; color: var(--text-secondary);">
                            "Good for quick actions and simple forms."
                        </p>
                    </SlidePanel>

                    // Medium panel (default)
                    <SlidePanel
                        open=show_medium
                        title="Medium Panel (Default)"
                    >
                        <p>"This is the default medium (480px) panel."</p>
                        <p style="margin-top: 12px; color: var(--text-secondary);">
                            "Ideal for details views and forms."
                        </p>
                    </SlidePanel>

                    // Large panel
                    <SlidePanel
                        open=show_large
                        title="Large Panel"
                        size=PanelSize::Large
                    >
                        <p>"This is a large (600px) panel."</p>
                        <p style="margin-top: 12px; color: var(--text-secondary);">
                            "More room for complex content."
                        </p>
                    </SlidePanel>

                    // XLarge panel
                    <SlidePanel
                        open=show_xlarge
                        title="XLarge Panel"
                        size=PanelSize::XLarge
                    >
                        <p>"This is an extra-large (800px) panel."</p>
                        <p style="margin-top: 12px; color: var(--text-secondary);">
                            "For data-rich views and large forms."
                        </p>
                    </SlidePanel>
                </div>
            </section>

            <section class="docs-section">
                <h2>"Props"</h2>
                <PropsTable props=vec![
                    PropInfo { name: "open", prop_type: "RwSignal<bool>", default: "-", description: "Controls visibility" },
                    PropInfo { name: "title", prop_type: "Option<String>", default: "None", description: "Panel title" },
                    PropInfo { name: "size", prop_type: "PanelSize", default: "Medium", description: "Width (Small/Medium/Large/XLarge)" },
                    PropInfo { name: "children", prop_type: "Children", default: "-", description: "Panel content" },
                ] />
            </section>
        </article>
    }
}

// ============================================================================
// AVATAR DOCUMENTATION
// ============================================================================

#[component]
fn AvatarDocs() -> impl IntoView {
    view! {
        <article class="component-docs">
            <header>
                <h1>"Avatar"</h1>
                <p class="description">"Photo with fallback to initials when no image available."</p>
            </header>

            <section class="docs-section">
                <h2>"Sizes"</h2>
                <div class="preview-container">
                    <div class="component-preview" style="display: flex; gap: 24px; align-items: center;">
                        <Avatar name="John Doe".to_string() size=AvatarSize::Small />
                        <Avatar name="Jane Smith".to_string() size=AvatarSize::Medium />
                        <Avatar name="Bob".to_string() size=AvatarSize::Large />
                    </div>
                </div>
            </section>

            <section class="docs-section">
                <h2>"Props"</h2>
                <PropsTable props=vec![
                    PropInfo { name: "photo_url", prop_type: "Option<String>", default: "None", description: "URL of the photo" },
                    PropInfo { name: "name", prop_type: "String", default: "-", description: "Name for generating initials" },
                    PropInfo { name: "size", prop_type: "AvatarSize", default: "Medium", description: "Small/Medium/Large" },
                ] />
            </section>
        </article>
    }
}

// ============================================================================
// SEARCH INPUT DOCUMENTATION
// ============================================================================

#[component]
fn SearchInputDocs() -> impl IntoView {
    let search_value = RwSignal::new(String::new());

    view! {
        <article class="component-docs">
            <header>
                <h1>"SearchInput"</h1>
                <p class="description">"Search input with icon and placeholder text."</p>
            </header>

            <section class="docs-section">
                <h2>"Example"</h2>
                <div class="preview-container">
                    <div class="component-preview">
                        <SearchInput
                            placeholder="Search employees..."
                            value=search_value
                        />
                        <p style="margin-top: 12px; color: var(--text-secondary);">
                            "Value: " {move || search_value.get()}
                        </p>
                    </div>
                </div>
            </section>

            <section class="docs-section">
                <h2>"Props"</h2>
                <PropsTable props=vec![
                    PropInfo { name: "placeholder", prop_type: "&'static str", default: "Search...", description: "Placeholder text" },
                    PropInfo { name: "value", prop_type: "RwSignal<String>", default: "-", description: "Two-way bound value" },
                ] />
            </section>
        </article>
    }
}

// ============================================================================
// FILTER DROPDOWN DOCUMENTATION
// ============================================================================

#[component]
fn FilterDropdownDocs() -> impl IntoView {
    let selected = RwSignal::new(String::new());
    let options = vec![
        "Engineering".to_string(),
        "Design".to_string(),
        "Marketing".to_string(),
    ];

    view! {
        <article class="component-docs">
            <header>
                <h1>"FilterDropdown"</h1>
                <p class="description">"Dropdown select for filtering lists."</p>
            </header>

            <section class="docs-section">
                <h2>"Example"</h2>
                <div class="preview-container">
                    <div class="component-preview">
                        <FilterDropdown
                            options=options
                            selected=selected
                            placeholder="All Departments"
                        />
                        <p style="margin-top: 12px; color: var(--text-secondary);">
                            "Selected: " {move || if selected.get().is_empty() { "All".to_string() } else { selected.get() }}
                        </p>
                    </div>
                </div>
            </section>

            <section class="docs-section">
                <h2>"Props"</h2>
                <PropsTable props=vec![
                    PropInfo { name: "options", prop_type: "Vec<String>", default: "-", description: "Available options" },
                    PropInfo { name: "selected", prop_type: "RwSignal<String>", default: "-", description: "Currently selected value" },
                    PropInfo { name: "placeholder", prop_type: "&'static str", default: "All", description: "Text for 'all' option" },
                ] />
            </section>
        </article>
    }
}

// ============================================================================
// PAGINATION DOCUMENTATION
// ============================================================================

#[component]
fn PaginationDocs() -> impl IntoView {
    let current_page = RwSignal::new(1usize);
    let page_size = RwSignal::new(10usize);
    let total_items = Signal::derive(move || 47usize);

    view! {
        <article class="component-docs">
            <header>
                <h1>"Pagination"</h1>
                <p class="description">"Table pagination controls with page size selector."</p>
            </header>

            <section class="docs-section">
                <h2>"Example"</h2>
                <div class="preview-container">
                    <div class="component-preview" style="background: var(--bg-surface);">
                        <Pagination
                            current_page=current_page
                            page_size=page_size
                            total_items=total_items
                        />
                    </div>
                </div>
            </section>

            <section class="docs-section">
                <h2>"Props"</h2>
                <PropsTable props=vec![
                    PropInfo { name: "current_page", prop_type: "RwSignal<usize>", default: "-", description: "Current page (1-indexed)" },
                    PropInfo { name: "page_size", prop_type: "RwSignal<usize>", default: "-", description: "Items per page" },
                    PropInfo { name: "total_items", prop_type: "Signal<usize>", default: "-", description: "Total number of items" },
                ] />
            </section>
        </article>
    }
}

// ============================================================================
// DATA TABLE DOCUMENTATION
// ============================================================================

#[component]
fn DataTableDocs() -> impl IntoView {
    let columns = vec![
        DataColumn::new("name", "Name"),
        DataColumn::new("email", "Email"),
        DataColumn::new("role", "Role"),
    ];

    let rows = vec![
        DataRow::new("1")
            .cell("name", "Alice Johnson")
            .cell("email", "alice@example.com")
            .cell("role", "Engineer"),
        DataRow::new("2")
            .cell("name", "Bob Smith")
            .cell("email", "bob@example.com")
            .cell("role", "Designer"),
        DataRow::new("3")
            .cell("name", "Carol White")
            .cell("email", "carol@example.com")
            .cell("role", "Manager"),
    ];

    view! {
        <article class="component-docs">
            <header>
                <h1>"DataTable"</h1>
                <p class="description">"Generic data table with column definitions and clickable rows."</p>
            </header>

            <section class="docs-section">
                <h2>"Example"</h2>
                <div class="preview-container">
                    <div class="component-preview">
                        <DataTable
                            columns=columns
                            rows=rows
                        />
                    </div>
                </div>
            </section>

            <section class="docs-section">
                <h2>"Props"</h2>
                <PropsTable props=vec![
                    PropInfo { name: "columns", prop_type: "Vec<DataColumn>", default: "-", description: "Column definitions with key and header" },
                    PropInfo { name: "rows", prop_type: "Vec<DataRow>", default: "-", description: "Row data with id and cells" },
                    PropInfo { name: "on_row_click", prop_type: "Option<Callback<String>>", default: "None", description: "Callback when row is clicked" },
                ] />
            </section>
        </article>
    }
}
