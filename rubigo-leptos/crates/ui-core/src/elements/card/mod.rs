//! Card Component
//!
//! A versatile container component for grouping related content.
//!
//! # Usage
//!
//! ```rust
//! use ui_core::elements::Card;
//!
//! // Basic card
//! view! { <Card title="My Card">Content here</Card> }
//!
//! // Card with all options
//! view! {
//!     <Card
//!         title="Dashboard"
//!         subtitle="Overview of your data"
//!         footer=view! { <Button>"Action"</Button> }
//!     >
//!         <p>"Card content"</p>
//!     </Card>
//! }
//! ```
//!
//! # Best Practices
//!
//! - Use cards to group related information
//! - Keep card titles concise (2-4 words)
//! - Use subtitles for additional context
//! - Place primary actions in the footer

use leptos::prelude::*;

stylance::import_crate_style!(style, "src/elements/card/card.module.css");

/// Card variant for different visual styles
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum CardVariant {
    /// Default card with border
    #[default]
    Default,
    /// Elevated card with shadow
    Elevated,
    /// Outlined card with prominent border
    Outlined,
}

impl CardVariant {
    fn class(&self) -> &'static str {
        match self {
            CardVariant::Default => "",
            CardVariant::Elevated => style::card_elevated,
            CardVariant::Outlined => style::card_outlined,
        }
    }
}

/// A versatile container for grouping content
#[component]
pub fn Card(
    /// Card title (optional)
    #[prop(optional, into)]
    title: Option<String>,
    /// Subtitle below the title (optional)
    #[prop(optional, into)]
    subtitle: Option<String>,
    /// Visual variant
    #[prop(default = CardVariant::Default)]
    variant: CardVariant,
    /// Footer content (optional)
    #[prop(optional)]
    footer: Option<Children>,
    /// Main card content
    children: Children,
) -> impl IntoView {
    let card_class = format!("{} {}", style::card, variant.class());

    view! {
        <div class=card_class>
            {(title.is_some() || subtitle.is_some()).then(|| view! {
                <div class=style::card_header>
                    {title.map(|t| view! { <h3 class=style::card_title>{t}</h3> })}
                    {subtitle.map(|s| view! { <p class=style::card_subtitle>{s}</p> })}
                </div>
            })}

            <div class=style::card_content>
                {children()}
            </div>

            {footer.map(|f| view! {
                <div class=style::card_footer>
                    {f()}
                </div>
            })}
        </div>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn card_variant_classes() {
        assert_eq!(CardVariant::Default.class(), "");
        assert!(!CardVariant::Elevated.class().is_empty());
        assert!(!CardVariant::Outlined.class().is_empty());
    }

    #[test]
    fn card_variant_default() {
        assert_eq!(CardVariant::default(), CardVariant::Default);
    }
}
