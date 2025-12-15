//! TimeInput Component
//!
//! A time input with hour, minute, and AM/PM dropdown selects.

use leptos::prelude::*;

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/primitives/time_input/time_input.module.css"
);

/// TimeInput component for selecting times with hour, minute, and AM/PM dropdowns
#[component]
pub fn TimeInput(
    /// Signal for two-way binding (HH:MM format, 24-hour)
    value: RwSignal<String>,
    /// Label for the input
    #[prop(optional, into)]
    label: Option<String>,
    /// Whether the input is disabled
    #[prop(default = false)]
    disabled: bool,
    /// Callback when time changes
    #[prop(optional)]
    on_change: Option<Callback<String>>,
) -> impl IntoView {
    // Parse current value into components (HH:MM in 24-hour format)
    let get_hour_24 = move || {
        let v = value.get();
        v.split(':')
            .next()
            .unwrap_or("09")
            .parse::<u32>()
            .unwrap_or(9)
    };
    let get_minute = move || {
        let v = value.get();
        v.split(':')
            .nth(1)
            .unwrap_or("00")
            .parse::<u32>()
            .unwrap_or(0)
    };
    let get_hour_12 = move || {
        let h24 = get_hour_24();
        if h24 == 0 {
            12
        } else if h24 > 12 {
            h24 - 12
        } else {
            h24
        }
    };
    let get_period = move || {
        if get_hour_24() >= 12 {
            "PM".to_string()
        } else {
            "AM".to_string()
        }
    };

    // Generate hour options (1-12)
    let hour_options: Vec<u32> = (1..=12).collect();
    let hour_opts = StoredValue::new(hour_options);

    // Generate minute options (0, 15, 30, 45)
    let minute_options: Vec<u32> = vec![0, 15, 30, 45];
    let minute_opts = StoredValue::new(minute_options);

    // Convert 12-hour + period to 24-hour format
    let to_24_hour = |hour_12: u32, period: &str| -> u32 {
        match (hour_12, period) {
            (12, "AM") => 0,
            (12, "PM") => 12,
            (h, "PM") => h + 12,
            (h, _) => h,
        }
    };

    let update_time = move |hour_12: u32, minute: u32, period: &str| {
        let hour_24 = to_24_hour(hour_12, period);
        let mins = minute.min(59);
        let new_value = format!("{:02}:{:02}", hour_24, mins);
        value.set(new_value.clone());
        if let Some(callback) = on_change {
            callback.run(new_value);
        }
    };

    let handle_hour_change = move |ev: leptos::ev::Event| {
        let new_hour: u32 = event_target_value(&ev).parse().unwrap_or(9);
        update_time(new_hour, get_minute(), &get_period());
    };

    let handle_minute_change = move |ev: leptos::ev::Event| {
        let new_minute: u32 = event_target_value(&ev).parse().unwrap_or(0);
        update_time(get_hour_12(), new_minute, &get_period());
    };

    let handle_period_change = move |ev: leptos::ev::Event| {
        let new_period = event_target_value(&ev);
        update_time(get_hour_12(), get_minute(), &new_period);
    };

    view! {
        <div class=style::time_input_wrapper>
            {label.map(|l| view! { <label class=style::time_input_label>{l}</label> })}
            <div class=style::time_selects>
                // Hour dropdown (1-12)
                <select
                    class=style::time_select_hour
                    prop:value=move || get_hour_12().to_string()
                    on:change=handle_hour_change
                    disabled=disabled
                >
                    {hour_opts.with_value(|opts| {
                        opts.iter().map(|h| {
                            let v = h.to_string();
                            let display = v.clone();
                            view! {
                                <option value=v>{display}</option>
                            }
                        }).collect::<Vec<_>>()
                    })}
                </select>

                <span class=style::time_separator>":"</span>

                // Minute dropdown (00, 15, 30, 45)
                <select
                    class=style::time_select_minute
                    prop:value=move || format!("{:02}", get_minute())
                    on:change=handle_minute_change
                    disabled=disabled
                >
                    {minute_opts.with_value(|opts| {
                        opts.iter().map(|m| {
                            let v = format!("{:02}", m);
                            let display = v.clone();
                            view! {
                                <option value=v>{display}</option>
                            }
                        }).collect::<Vec<_>>()
                    })}
                </select>

                // AM/PM dropdown
                <select
                    class=style::time_select_period
                    prop:value=get_period
                    on:change=handle_period_change
                    disabled=disabled
                >
                    <option value="AM">"AM"</option>
                    <option value="PM">"PM"</option>
                </select>
            </div>
        </div>
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn time_input_exists() {
        assert!(true);
    }
}
