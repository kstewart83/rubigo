//! Badge Component
//!
//! A small label for status indicators and metadata.

use leptos::prelude::*;

stylance::import_crate_style!(style, "src/primitives/badge/badge.module.css");

/// Badge variant for semantic coloring
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum BadgeVariant {
    #[default]
    Default,
    Primary,
    Success,
    Warning,
    Error,
}

impl BadgeVariant {
    fn class_name(&self) -> &'static str {
        match self {
            BadgeVariant::Default => style::badge_default,
            BadgeVariant::Primary => style::badge_primary,
            BadgeVariant::Success => style::badge_success,
            BadgeVariant::Warning => style::badge_warning,
            BadgeVariant::Error => style::badge_error,
        }
    }
}

/// Badge size
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum BadgeSize {
    Small,
    #[default]
    Medium,
    Large,
}

impl BadgeSize {
    fn class_name(&self) -> &'static str {
        match self {
            BadgeSize::Small => style::badge_sm,
            BadgeSize::Medium => "", // Medium is base
            BadgeSize::Large => style::badge_lg,
        }
    }
}

/// Badge component for status indicators
///
/// # Example
/// ```ignore
/// use ui_core::primitives::{Badge, BadgeVariant};
/// use leptos::prelude::*;
///
/// view! {
///     <Badge variant=BadgeVariant::Success>"Active"</Badge>
/// }
/// ```
#[component]
pub fn Badge(
    /// Badge variant for color
    #[prop(default = BadgeVariant::Default)]
    variant: BadgeVariant,
    /// Badge size
    #[prop(default = BadgeSize::Medium)]
    size: BadgeSize,
    /// Badge content
    children: Children,
) -> impl IntoView {
    let class = format!(
        "{} {} {}",
        style::badge,
        variant.class_name(),
        size.class_name()
    );

    view! {
        <span class=class>
            {children()}
        </span>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn badge_variant_returns_class() {
        assert!(!BadgeVariant::Default.class_name().is_empty());
        assert!(!BadgeVariant::Primary.class_name().is_empty());
        assert!(!BadgeVariant::Success.class_name().is_empty());
        assert!(!BadgeVariant::Warning.class_name().is_empty());
        assert!(!BadgeVariant::Error.class_name().is_empty());
    }

    #[test]
    fn badge_variant_default() {
        assert_eq!(BadgeVariant::default(), BadgeVariant::Default);
    }

    #[test]
    fn badge_size_default() {
        assert_eq!(BadgeSize::default(), BadgeSize::Medium);
    }
}
