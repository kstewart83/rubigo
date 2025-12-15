//! Search Input Component
//!
//! Styled search input with placeholder text.

use leptos::prelude::*;

stylance::import_crate_style!(style, "src/primitives/search_input/search_input.module.css");

/// Search input component
#[component]
pub fn SearchInput(
    /// Placeholder text
    #[prop(default = "Search...")]
    placeholder: &'static str,
    /// Value signal (two-way binding)
    value: RwSignal<String>,
) -> impl IntoView {
    view! {
        <div class=style::search_wrapper>
            <span class=style::search_icon>"🔍"</span>
            <input
                type="text"
                placeholder=placeholder
                class=style::search_input
                prop:value=move || value.get()
                on:input=move |ev| value.set(event_target_value(&ev))
            />
        </div>
    }
}
