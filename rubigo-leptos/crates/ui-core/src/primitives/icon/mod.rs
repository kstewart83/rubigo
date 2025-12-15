//! Icon Component
//!
//! A wrapper for SVG icons with consistent sizing.

use leptos::prelude::*;

stylance::import_crate_style!(style, "src/primitives/icon/icon.module.css");

/// Icon size variants
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum IconSize {
    Small,
    #[default]
    Medium,
    Large,
    XLarge,
}

impl IconSize {
    fn class_name(&self) -> &'static str {
        match self {
            IconSize::Small => style::icon_sm,
            IconSize::Medium => style::icon_md,
            IconSize::Large => style::icon_lg,
            IconSize::XLarge => style::icon_xl,
        }
    }
}

/// Icon component for displaying SVG icons
///
/// # Example
/// ```ignore
/// use ui_core::primitives::Icon;
/// use leptos::prelude::*;
///
/// view! {
///     <Icon name="home" />
/// }
/// ```
#[component]
pub fn Icon(
    /// Icon name (used for aria-label)
    name: &'static str,
    /// Icon size
    #[prop(default = IconSize::Medium)]
    size: IconSize,
    /// Additional CSS class
    #[prop(default = "")]
    class: &'static str,
    /// SVG content (inner HTML)
    #[prop(optional)]
    children: Option<Children>,
) -> impl IntoView {
    let combined_class = format!("{} {} {}", style::icon, size.class_name(), class);

    view! {
        <span
            class=combined_class
            role="img"
            aria-label=name
        >
            {children.map(|c| c())}
        </span>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn icon_size_returns_class() {
        assert!(!IconSize::Small.class_name().is_empty());
        assert!(!IconSize::Medium.class_name().is_empty());
        assert!(!IconSize::Large.class_name().is_empty());
        assert!(!IconSize::XLarge.class_name().is_empty());
    }

    #[test]
    fn icon_size_default_is_medium() {
        assert_eq!(IconSize::default(), IconSize::Medium);
    }
}
