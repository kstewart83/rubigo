//! Select Component
//!
//! A dropdown select input with options.

use leptos::prelude::*;

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/primitives/select/select.module.css"
);

/// Select size variants
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum SelectSize {
    Small,
    #[default]
    Medium,
    Large,
}

impl SelectSize {
    fn class_name(&self) -> &'static str {
        match self {
            SelectSize::Small => style::select_sm,
            SelectSize::Medium => "",
            SelectSize::Large => style::select_lg,
        }
    }
}

/// A single option for the select dropdown
#[derive(Debug, Clone, PartialEq)]
pub struct SelectOption {
    pub value: String,
    pub label: String,
}

impl SelectOption {
    pub fn new(value: impl Into<String>, label: impl Into<String>) -> Self {
        Self {
            value: value.into(),
            label: label.into(),
        }
    }
}

/// Select dropdown component
#[component]
pub fn Select(
    /// Signal for two-way binding (holds selected value)
    value: RwSignal<String>,
    /// Available options
    options: Vec<SelectOption>,
    /// Placeholder text when no value selected
    #[prop(default = "Select...")]
    placeholder: &'static str,
    /// Size variant
    #[prop(default = SelectSize::Medium)]
    size: SelectSize,
    /// Whether the select is disabled
    #[prop(default = false)]
    disabled: bool,
    /// Optional label
    #[prop(optional, into)]
    label: Option<String>,
    /// Callback when selection changes
    #[prop(optional)]
    on_change: Option<Callback<String>>,
) -> impl IntoView {
    let class = format!("{} {}", style::select, size.class_name());

    let handle_change = move |ev: leptos::ev::Event| {
        let new_value = event_target_value(&ev);
        value.set(new_value.clone());
        if let Some(callback) = on_change {
            callback.run(new_value);
        }
    };

    view! {
        <div class=style::select_wrapper>
            {label.map(|l| view! { <label class=style::select_label>{l}</label> })}
            <select
                class=class
                disabled=disabled
                on:change=handle_change
            >
                <option value="" disabled selected=move || value.get().is_empty()>
                    {placeholder}
                </option>
                {options.into_iter().map(|opt| {
                    let opt_value = opt.value.clone();
                    let opt_label = opt.label.clone();
                    let is_selected = {
                        let v = opt.value.clone();
                        move || value.get() == v
                    };
                    view! {
                        <option value=opt_value selected=is_selected>
                            {opt_label}
                        </option>
                    }
                }).collect::<Vec<_>>()}
            </select>
        </div>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn select_option_new() {
        let opt = SelectOption::new("val", "Label");
        assert_eq!(opt.value, "val");
        assert_eq!(opt.label, "Label");
    }

    #[test]
    fn select_size_default() {
        assert_eq!(SelectSize::default(), SelectSize::Medium);
    }
}
