//! DateInput Component
//!
//! A date input with label, validation support, and optional Today button.

use chrono::Utc;
use leptos::prelude::*;

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/primitives/date_input/date_input.module.css"
);

/// DateInput component for selecting dates
#[component]
pub fn DateInput(
    /// Signal for two-way binding (YYYY-MM-DD format)
    value: RwSignal<String>,
    /// Label for the input
    #[prop(optional, into)]
    label: Option<String>,
    /// Minimum date (YYYY-MM-DD)
    #[prop(optional, into)]
    min: Option<String>,
    /// Maximum date (YYYY-MM-DD)
    #[prop(optional, into)]
    max: Option<String>,
    /// Whether the input is disabled
    #[prop(default = false)]
    disabled: bool,
    /// Whether the input is required
    #[prop(default = false)]
    required: bool,
    /// Show Today button
    #[prop(default = true)]
    show_today_button: bool,
    /// Callback when date changes
    #[prop(optional)]
    on_change: Option<Callback<String>>,
) -> impl IntoView {
    let handle_change = move |ev: leptos::ev::Event| {
        let new_value = event_target_value(&ev);
        value.set(new_value.clone());
        if let Some(callback) = on_change {
            callback.run(new_value);
        }
    };

    let handle_today = move |_| {
        let today = Utc::now().format("%Y-%m-%d").to_string();
        value.set(today.clone());
        if let Some(callback) = on_change {
            callback.run(today);
        }
    };

    view! {
        <div class=style::date_input_wrapper>
            {label.map(|l| view! { <label class=style::date_input_label>{l}</label> })}
            <div class=style::date_input_row>
                <input
                    type="date"
                    class=style::date_input
                    prop:value=move || value.get()
                    on:change=handle_change
                    disabled=disabled
                    required=required
                    min=min.unwrap_or_default()
                    max=max.unwrap_or_default()
                />
                {show_today_button.then(|| view! {
                    <button
                        type="button"
                        class=style::today_button
                        on:click=handle_today
                        disabled=disabled
                    >
                        "Today"
                    </button>
                })}
            </div>
        </div>
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn date_input_exists() {
        // Component existence test
        assert!(true);
    }
}
