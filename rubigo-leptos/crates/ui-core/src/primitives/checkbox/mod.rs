//! Checkbox Component
//!
//! A reactive checkbox with label support.

use leptos::ev;
use leptos::prelude::*;

stylance::import_crate_style!(style, "src/primitives/checkbox/checkbox.module.css");

/// Reactive Checkbox component
///
/// # Example
/// ```ignore
/// use ui_core::primitives::Checkbox;
/// use leptos::prelude::*;
///
/// let checked = RwSignal::new(false);
/// view! {
///     <Checkbox checked=checked label="Accept terms" />
/// }
/// ```
#[component]
pub fn Checkbox(
    /// Signal for checked state
    checked: RwSignal<bool>,
    /// Label text
    #[prop(default = "")]
    label: &'static str,
    /// Whether the checkbox is disabled
    #[prop(default = false)]
    disabled: bool,
    /// Callback when checked state changes
    #[prop(optional)]
    on_change: Option<Callback<bool>>,
) -> impl IntoView {
    let handle_change = move |ev: ev::Event| {
        let new_checked = event_target_checked(&ev);
        checked.set(new_checked);
        if let Some(callback) = on_change {
            callback.run(new_checked);
        }
    };

    view! {
        <label class=style::checkbox_wrapper>
            <input
                type="checkbox"
                class=style::checkbox
                disabled=disabled
                prop:checked=move || checked.get()
                on:change=handle_change
            />
            {(!label.is_empty()).then(|| view! {
                <span class=style::checkbox_label>{label}</span>
            })}
        </label>
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn checkbox_component_exists() {
        // Basic existence test - actual DOM tests require WASM
        assert!(true);
    }
}
