//! Reusable Widget Card Component
//!
//! A flexible card component for the bento box dashboard that can contain
//! various types of content with consistent styling.

use leptos::prelude::*;
use leptos::IntoView;

/// Widget size variants for bento box grid
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum WidgetSize {
    /// Small widget (1x1 grid cell)
    Small,
    /// Medium widget (1x2 or 2x1 grid cells)
    Medium,
    /// Large widget (2x2 grid cells)
    Large,
    /// Wide widget (spans full width)
    Wide,
}

impl WidgetSize {
    pub fn css_class(&self) -> &'static str {
        match self {
            WidgetSize::Small => "widget-small",
            WidgetSize::Medium => "widget-medium",
            WidgetSize::Large => "widget-large",
            WidgetSize::Wide => "widget-wide",
        }
    }
}

/// Reusable widget card component
///
/// # Props
/// - `title`: Widget header title
/// - `size`: Size variant for grid layout
/// - `icon`: Emoji/icon to show in header (use empty string for none)
/// - `children`: Widget content
#[component]
pub fn WidgetCard(
    title: &'static str,
    size: WidgetSize,
    #[prop(default = "")] icon: &'static str,
    children: Children,
) -> impl IntoView {
    let size_class = size.css_class();
    let has_icon = !icon.is_empty();

    view! {
        <div class=format!("widget-card {}", size_class)>
            <div class="widget-header">
                {if has_icon { Some(view! { <span class="widget-icon">{icon}</span> }) } else { None }}
                <h3 class="widget-title">{title}</h3>
            </div>
            <div class="widget-content">
                {children()}
            </div>
        </div>
    }
}
