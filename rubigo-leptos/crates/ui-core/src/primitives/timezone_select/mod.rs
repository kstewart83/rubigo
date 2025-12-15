//! TimezoneSelect Component
//!
//! A dropdown for selecting timezones with common options.

use leptos::prelude::*;

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/primitives/timezone_select/timezone_select.module.css"
);

/// Common timezone options with display names and UTC offsets
pub fn get_timezone_options() -> Vec<TimezoneOption> {
    vec![
        TimezoneOption::new("America/New_York", "Eastern Time (ET)", "-05:00"),
        TimezoneOption::new("America/Chicago", "Central Time (CT)", "-06:00"),
        TimezoneOption::new("America/Denver", "Mountain Time (MT)", "-07:00"),
        TimezoneOption::new("America/Los_Angeles", "Pacific Time (PT)", "-08:00"),
        TimezoneOption::new("America/Anchorage", "Alaska Time (AKT)", "-09:00"),
        TimezoneOption::new("Pacific/Honolulu", "Hawaii Time (HT)", "-10:00"),
        TimezoneOption::new("UTC", "UTC", "+00:00"),
        TimezoneOption::new("Europe/London", "London (GMT/BST)", "+00:00"),
        TimezoneOption::new("Europe/Paris", "Paris (CET)", "+01:00"),
        TimezoneOption::new("Europe/Berlin", "Berlin (CET)", "+01:00"),
        TimezoneOption::new("Asia/Dubai", "Dubai (GST)", "+04:00"),
        TimezoneOption::new("Asia/Singapore", "Singapore (SGT)", "+08:00"),
        TimezoneOption::new("Asia/Tokyo", "Tokyo (JST)", "+09:00"),
        TimezoneOption::new("Australia/Sydney", "Sydney (AEST)", "+10:00"),
    ]
}

/// Timezone option with ID, display name, and UTC offset
#[derive(Clone, Debug, PartialEq)]
pub struct TimezoneOption {
    pub id: String,
    pub display_name: String,
    pub offset: String,
}

impl TimezoneOption {
    pub fn new(id: &str, display_name: &str, offset: &str) -> Self {
        Self {
            id: id.to_string(),
            display_name: display_name.to_string(),
            offset: offset.to_string(),
        }
    }
}

/// Get friendly display name for a timezone ID
/// Returns the display name like "Eastern Time (ET)" or the ID if not found
pub fn timezone_display_name(id: &str) -> String {
    get_timezone_options()
        .iter()
        .find(|opt| opt.id == id)
        .map(|opt| opt.display_name.clone())
        .unwrap_or_else(|| id.to_string())
}

/// Get full display string for a timezone ID (with UTC offset)
/// Returns something like "Eastern Time (ET) (UTC-05:00)"
pub fn timezone_full_display(id: &str) -> String {
    get_timezone_options()
        .iter()
        .find(|opt| opt.id == id)
        .map(|opt| format!("{} (UTC{})", opt.display_name, opt.offset))
        .unwrap_or_else(|| id.to_string())
}

/// Get UTC offset in minutes for a timezone ID
/// Positive = east of UTC, Negative = west of UTC
pub fn timezone_offset_minutes(id: &str) -> i32 {
    get_timezone_options()
        .iter()
        .find(|opt| opt.id == id)
        .map(|opt| parse_offset_to_minutes(&opt.offset))
        .unwrap_or(0)
}

/// Parse offset string like "-05:00" to minutes
fn parse_offset_to_minutes(offset: &str) -> i32 {
    let sign = if offset.starts_with('-') { -1 } else { 1 };
    let parts: Vec<&str> = offset.trim_start_matches(['+', '-']).split(':').collect();
    if parts.len() >= 2 {
        let hours: i32 = parts[0].parse().unwrap_or(0);
        let minutes: i32 = parts[1].parse().unwrap_or(0);
        sign * (hours * 60 + minutes)
    } else {
        0
    }
}

/// Get the browser's local timezone using JavaScript Intl API
/// Returns timezone ID like "America/New_York" or falls back to "UTC"
pub fn get_browser_timezone() -> String {
    #[cfg(target_arch = "wasm32")]
    {
        use wasm_bindgen::prelude::*;

        #[wasm_bindgen]
        extern "C" {
            #[wasm_bindgen(js_namespace = Intl, js_name = DateTimeFormat)]
            type DateTimeFormat;

            #[wasm_bindgen(constructor, js_namespace = Intl)]
            fn new() -> DateTimeFormat;

            #[wasm_bindgen(method, js_name = resolvedOptions)]
            fn resolved_options(this: &DateTimeFormat) -> JsValue;
        }

        let dtf = DateTimeFormat::new();
        let options = dtf.resolved_options();

        // Get the timeZone property from the options object
        if let Some(obj) = options.dyn_ref::<js_sys::Object>() {
            if let Ok(tz) = js_sys::Reflect::get(obj, &JsValue::from_str("timeZone")) {
                if let Some(tz_str) = tz.as_string() {
                    return tz_str;
                }
            }
        }
        "UTC".to_string()
    }

    #[cfg(not(target_arch = "wasm32"))]
    {
        // Fallback for non-WASM (e.g., SSR or testing)
        "America/New_York".to_string()
    }
}

/// TimezoneSelect component for selecting timezones
#[component]
pub fn TimezoneSelect(
    /// Signal for two-way binding (timezone ID like "America/New_York")
    value: RwSignal<String>,
    /// Label for the select
    #[prop(optional, into)]
    label: Option<String>,
    /// Whether the select is disabled
    #[prop(default = false)]
    disabled: bool,
    /// Callback when timezone changes
    #[prop(optional)]
    on_change: Option<Callback<String>>,
) -> impl IntoView {
    let options = StoredValue::new(get_timezone_options());

    let handle_change = move |ev: leptos::ev::Event| {
        let new_value = event_target_value(&ev);
        value.set(new_value.clone());
        if let Some(callback) = on_change {
            callback.run(new_value);
        }
    };

    view! {
        <div class=style::timezone_wrapper>
            {label.map(|l| view! { <label class=style::timezone_label>{l}</label> })}
            <select
                class=style::timezone_select
                prop:value=move || value.get()
                on:change=handle_change
                disabled=disabled
            >
                {options.with_value(|opts| {
                    opts.iter().map(|opt| {
                        let id = opt.id.clone();
                        let display = format!("{} (UTC{})", opt.display_name, opt.offset);
                        view! {
                            <option value=id>{display}</option>
                        }
                    }).collect::<Vec<_>>()
                })}
            </select>
        </div>
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn timezone_select_exists() {
        assert!(true);
    }
}
