//! Filter Dropdown Component
//!
//! Generic select dropdown for filtering lists.

use leptos::prelude::*;

stylance::import_crate_style!(
    style,
    "src/elements/filter_dropdown/filter_dropdown.module.css"
);

/// Filter dropdown component
#[component]
pub fn FilterDropdown(
    /// Available options
    options: Vec<String>,
    /// Currently selected value (empty string = all)
    selected: RwSignal<String>,
    /// Placeholder text for "all" option
    #[prop(default = "All")]
    placeholder: &'static str,
) -> impl IntoView {
    view! {
        <select
            class=style::filter_dropdown
            on:change=move |ev| selected.set(event_target_value(&ev))
        >
            <option value="">{placeholder}</option>
            {options.into_iter().map(|opt| {
                let value = opt.clone();
                let text = opt.clone();
                view! { <option value=value>{text}</option> }
            }).collect::<Vec<_>>()}
        </select>
    }
}
