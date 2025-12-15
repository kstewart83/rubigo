//! Button Component
//!
//! A reactive button with variants, sizes, and loading states.

use leptos::ev;
use leptos::prelude::*;

// Import scoped CSS class names from Stylance-processed module
stylance::import_crate_style!(style, "src/primitives/button/button.module.css");

/// Button variant determines the visual style
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum ButtonVariant {
    #[default]
    Primary,
    Secondary,
    Danger,
    Ghost,
}

impl ButtonVariant {
    fn class_name(&self) -> &'static str {
        match self {
            ButtonVariant::Primary => style::btn_primary,
            ButtonVariant::Secondary => style::btn_secondary,
            ButtonVariant::Danger => style::btn_danger,
            ButtonVariant::Ghost => style::btn_ghost,
        }
    }
}

/// Button size
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum ButtonSize {
    Small,
    #[default]
    Medium,
    Large,
}

impl ButtonSize {
    fn class_name(&self) -> &'static str {
        match self {
            ButtonSize::Small => style::btn_sm,
            ButtonSize::Medium => style::btn_md,
            ButtonSize::Large => style::btn_lg,
        }
    }
}

/// Reactive Button component
///
/// # Example
/// ```ignore
/// use ui_core::primitives::Button;
/// use leptos::prelude::*;
///
/// view! {
///     <Button on_click=|_| log::info!("Clicked!")>
///         "Click me"
///     </Button>
/// }
/// ```
#[component]
pub fn Button(
    /// Button variant (Primary, Secondary, Danger, Ghost)
    #[prop(default = ButtonVariant::Primary)]
    variant: ButtonVariant,
    /// Button size (Small, Medium, Large)
    #[prop(default = ButtonSize::Medium)]
    size: ButtonSize,
    /// Whether the button is disabled
    #[prop(default = false)]
    disabled: bool,
    /// Whether the button is in a loading state
    #[prop(default = false)]
    loading: bool,
    /// Click handler
    #[prop(optional)]
    on_click: Option<Callback<ev::MouseEvent>>,
    /// Button content
    children: Children,
) -> impl IntoView {
    let class = format!(
        "{} {} {} {}",
        style::btn,
        variant.class_name(),
        size.class_name(),
        if loading { style::loading } else { "" }
    );

    let handle_click = move |ev: ev::MouseEvent| {
        if !disabled && !loading {
            if let Some(callback) = on_click {
                callback.run(ev);
            }
        }
    };

    // Render children once - loading state handled with conditional views
    if loading {
        view! {
            <button
                class=class
                disabled=true
                on:click=handle_click
            >
                <span class=style::spinner></span>
                <span class=style::loading_text>{children()}</span>
            </button>
        }
        .into_any()
    } else {
        view! {
            <button
                class=class
                disabled=disabled
                on:click=handle_click
            >
                {children()}
            </button>
        }
        .into_any()
    }
}

#[cfg(test)]
mod tests;
