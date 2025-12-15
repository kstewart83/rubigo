//! Input Component
//!
//! A reactive text input with validation and error states.

#![allow(dead_code)]

use leptos::ev;
use leptos::prelude::*;

stylance::import_crate_style!(style, "src/primitives/input/input.module.css");

/// Input size variants
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum InputSize {
    Small,
    #[default]
    Medium,
    Large,
}

impl InputSize {
    fn class_name(&self) -> &'static str {
        match self {
            InputSize::Small => style::input_sm,
            InputSize::Medium => "", // Medium is base size
            InputSize::Large => style::input_lg,
        }
    }
}

/// Input type
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum InputType {
    #[default]
    Text,
    Password,
    Email,
    Number,
    Search,
}

impl InputType {
    fn as_str(&self) -> &'static str {
        match self {
            InputType::Text => "text",
            InputType::Password => "password",
            InputType::Email => "email",
            InputType::Number => "number",
            InputType::Search => "search",
        }
    }
}

/// Reactive Input component with two-way binding
///
/// # Example
/// ```ignore
/// use ui_core::primitives::{Input, InputSize};
/// use leptos::prelude::*;
///
/// let value = RwSignal::new(String::new());
/// view! {
///     <Input value=value placeholder="Enter text..." />
/// }
/// ```
#[component]
pub fn Input(
    /// Signal for two-way binding
    value: RwSignal<String>,
    /// Input type
    #[prop(default = InputType::Text)]
    input_type: InputType,
    /// Input size
    #[prop(default = InputSize::Medium)]
    size: InputSize,
    /// Placeholder text
    #[prop(default = "")]
    placeholder: &'static str,
    /// Whether the input is disabled
    #[prop(default = false)]
    disabled: bool,
    /// Error message (shows error state when Some)
    #[prop(optional)]
    error: Option<String>,
    /// Callback when input changes
    #[prop(optional)]
    on_change: Option<Callback<String>>,
    /// Callback when input gains focus
    #[prop(optional)]
    on_focus: Option<Callback<ev::FocusEvent>>,
    /// Callback when input loses focus
    #[prop(optional)]
    on_blur: Option<Callback<ev::FocusEvent>>,
) -> impl IntoView {
    let has_error = error.is_some();
    let error_msg = error.clone();

    let class = format!(
        "{} {} {}",
        style::input,
        size.class_name(),
        if has_error { style::input_error } else { "" }
    );

    let handle_input = move |ev: ev::Event| {
        let new_value = event_target_value(&ev);
        value.set(new_value.clone());
        if let Some(callback) = on_change {
            callback.run(new_value);
        }
    };

    let handle_focus = move |ev: ev::FocusEvent| {
        if let Some(callback) = on_focus {
            callback.run(ev);
        }
    };

    let handle_blur = move |ev: ev::FocusEvent| {
        if let Some(callback) = on_blur {
            callback.run(ev);
        }
    };

    view! {
        <div class=style::input_wrapper>
            <input
                type=input_type.as_str()
                class=class
                placeholder=placeholder
                disabled=disabled
                prop:value=move || value.get()
                on:input=handle_input
                on:focus=handle_focus
                on:blur=handle_blur
            />
            {error_msg.map(|msg| view! {
                <p class=style::error_message>{msg}</p>
            })}
        </div>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn input_type_as_str() {
        assert_eq!(InputType::Text.as_str(), "text");
        assert_eq!(InputType::Password.as_str(), "password");
        assert_eq!(InputType::Email.as_str(), "email");
        assert_eq!(InputType::Number.as_str(), "number");
        assert_eq!(InputType::Search.as_str(), "search");
    }

    #[test]
    fn input_size_default_is_medium() {
        assert_eq!(InputSize::default(), InputSize::Medium);
    }

    #[test]
    fn input_type_default_is_text() {
        assert_eq!(InputType::default(), InputType::Text);
    }
}
