//! Avatar Component
//!
//! Displays a user photo with fallback to initials.

use leptos::prelude::*;

stylance::import_crate_style!(style, "src/primitives/avatar/avatar.module.css");

/// Avatar size variants
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum AvatarSize {
    /// 32px - for tables and compact views
    Small,
    /// 48px - for cards
    #[default]
    Medium,
    /// 72px - for detail panels
    Large,
}

impl AvatarSize {
    pub fn class(&self) -> &'static str {
        match self {
            AvatarSize::Small => style::avatar_small,
            AvatarSize::Medium => style::avatar_medium,
            AvatarSize::Large => style::avatar_large,
        }
    }
}

/// Get initials from a name (first letter of first and last name)
fn get_initials(name: &str) -> String {
    name.split_whitespace()
        .filter_map(|word| word.chars().next())
        .take(2)
        .collect::<String>()
        .to_uppercase()
}

/// Avatar component with photo and initials fallback
#[component]
pub fn Avatar(
    /// URL of the photo (optional)
    #[prop(optional, into)]
    photo_url: Option<String>,
    /// Name for generating initials fallback
    #[prop(into)]
    name: String,
    /// Size variant
    #[prop(default = AvatarSize::Medium)]
    size: AvatarSize,
) -> impl IntoView {
    let initials = get_initials(&name);
    let has_photo = photo_url.is_some();
    let avatar_class = format!("{} {}", style::avatar, size.class());

    view! {
        {if has_photo {
            view! {
                <img
                    src=photo_url.unwrap_or_default()
                    alt=name
                    class=avatar_class.clone()
                />
            }.into_any()
        } else {
            view! {
                <div class=format!("{} {}", avatar_class, style::avatar_initials)>
                    {initials}
                </div>
            }.into_any()
        }}
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn initials_two_words() {
        assert_eq!(get_initials("John Doe"), "JD");
    }

    #[test]
    fn initials_one_word() {
        assert_eq!(get_initials("John"), "J");
    }

    #[test]
    fn initials_three_words() {
        assert_eq!(get_initials("John Middle Doe"), "JM");
    }
}
