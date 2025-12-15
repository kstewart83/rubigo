//! Tabs Component
//!
//! A tabbed interface for switching between views.
//!
//! # Usage
//!
//! ```rust
//! use ui_core::elements::{Tabs, TabItem};
//!
//! let active = RwSignal::new("overview".to_string());
//!
//! let tabs = vec![
//!     TabItem::new("overview", "Overview"),
//!     TabItem::new("details", "Details"),
//!     TabItem::new("settings", "Settings"),
//! ];
//!
//! view! {
//!     <Tabs items=tabs active_tab=active />
//!     
//!     <Show when=move || active.get() == "overview">
//!         <OverviewPanel />
//!     </Show>
//! }
//! ```
//!
//! # Best Practices
//!
//! - Use tabs for related content at the same hierarchy level
//! - Keep tab labels short (1-2 words)
//! - Show 3-7 tabs; use dropdown for more
//! - Consider icons with labels for visual distinction

use leptos::prelude::*;

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/elements/tabs/tabs.module.css"
);

/// Tab item definition
#[derive(Debug, Clone)]
pub struct TabItem {
    /// Unique identifier
    pub id: String,
    /// Display label
    pub label: String,
    /// Optional icon (emoji or icon component)
    pub icon: Option<String>,
    /// Disabled state
    pub disabled: bool,
    /// Badge count (optional)
    pub badge: Option<u32>,
}

impl TabItem {
    /// Create a new tab item
    pub fn new(id: impl Into<String>, label: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            label: label.into(),
            icon: None,
            disabled: false,
            badge: None,
        }
    }

    /// Add an icon
    pub fn icon(mut self, icon: impl Into<String>) -> Self {
        self.icon = Some(icon.into());
        self
    }

    /// Set disabled state
    pub fn disabled(mut self) -> Self {
        self.disabled = true;
        self
    }

    /// Add a badge count
    pub fn badge(mut self, count: u32) -> Self {
        self.badge = Some(count);
        self
    }
}

/// Tabs variant
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum TabsVariant {
    #[default]
    Underline,
    Pills,
    Boxed,
}

impl TabsVariant {
    fn class(&self) -> &'static str {
        match self {
            TabsVariant::Underline => "",
            TabsVariant::Pills => style::tabs_pills,
            TabsVariant::Boxed => style::tabs_boxed,
        }
    }
}

/// Tabbed navigation component
#[component]
pub fn Tabs(
    /// Tab items
    items: Vec<TabItem>,
    /// Active tab ID (reactive signal)
    active_tab: RwSignal<String>,
    /// Visual variant
    #[prop(default = TabsVariant::Underline)]
    variant: TabsVariant,
    /// Callback when tab changes
    #[prop(optional)]
    on_change: Option<Callback<String>>,
) -> impl IntoView {
    let tabs_class = format!("{} {}", style::tabs, variant.class());

    view! {
        <div class=tabs_class role="tablist">
            {items.into_iter().map(|item| {
                let item_id = item.id.clone();
                let item_id_click = item_id.clone();
                let item_id_active = item_id.clone();
                let is_disabled = item.disabled;

                view! {
                    <button
                        class=style::tab
                        class:active=move || active_tab.get() == item_id_active
                        disabled=is_disabled
                        role="tab"
                        aria-selected=move || active_tab.get() == item_id
                        on:click=move |_| {
                            if !is_disabled {
                                active_tab.set(item_id_click.clone());
                                if let Some(callback) = on_change {
                                    callback.run(item_id_click.clone());
                                }
                            }
                        }
                    >
                        {item.icon.map(|i| view! { <span class=style::tab_icon>{i}</span> })}
                        <span>{item.label}</span>
                        {item.badge.map(|b| view! { <span class=style::tab_badge>{b}</span> })}
                    </button>
                }
            }).collect::<Vec<_>>()}
        </div>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tab_item_builder() {
        let tab = TabItem::new("settings", "Settings").icon("⚙️").badge(5);

        assert_eq!(tab.id, "settings");
        assert_eq!(tab.label, "Settings");
        assert_eq!(tab.icon, Some("⚙️".to_string()));
        assert_eq!(tab.badge, Some(5));
        assert!(!tab.disabled);
    }

    #[test]
    fn tabs_variant_classes() {
        assert_eq!(TabsVariant::Underline.class(), "");
        assert!(!TabsVariant::Pills.class().is_empty());
        assert!(!TabsVariant::Boxed.class().is_empty());
    }
}
