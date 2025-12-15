//! Day View Component
//!
//! Displays a single day calendar with time-based event positioning.

use chrono::{NaiveDate, Utc};
use leptos::prelude::*;

use super::calendar_types::CalendarEvent;

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/features/calendar/calendar.module.css"
);

/// Hours to display in day view (6 AM to 10 PM)
const START_HOUR: u32 = 6;
const END_HOUR: u32 = 22;
const PIXELS_PER_HOUR: u32 = 60;

/// Day view with time-based event positioning
#[component]
pub fn DayView(
    /// Current date to display
    current_date: NaiveDate,
    /// Events to display
    events: Vec<CalendarEvent>,
    /// Callback when an event is clicked - receives (event_id, instance_date)
    #[prop(optional)]
    on_event_click: Option<Callback<(String, NaiveDate)>>,
) -> impl IntoView {
    let today = Utc::now().date_naive();
    let hours: Vec<u32> = (START_HOUR..END_HOUR).collect();
    let is_today = current_date == today;

    // Filter events for this day
    let day_events: Vec<&CalendarEvent> = events
        .iter()
        .filter(|e| e.occurs_on(current_date))
        .collect();

    let day_class = if is_today {
        format!("{} {}", style::day_view, style::today)
    } else {
        style::day_view.to_string()
    };

    view! {
        <div class=day_class>
            // Day header
            <div class=style::day_header>
                <span class=style::day_header_name>{current_date.format("%A").to_string()}</span>
                <span class=style::day_header_date>{current_date.format("%B %e, %Y").to_string()}</span>
            </div>

            // Day body
            <div class=style::day_body>
                // Time column
                <div class=style::day_time_column>
                    {hours.iter().map(|hour| {
                        let label = if *hour < 12 {
                            format!("{} AM", hour)
                        } else if *hour == 12 {
                            "12 PM".to_string()
                        } else {
                            format!("{} PM", hour - 12)
                        };

                        view! {
                            <div class=style::day_time_slot>
                                <span>{label}</span>
                            </div>
                        }
                    }).collect::<Vec<_>>()}
                </div>

                // Events column
                <div class=style::day_events_column>
                    // Hour grid lines
                    {hours.iter().map(|_| {
                        view! { <div class=style::day_hour_line></div> }
                    }).collect::<Vec<_>>()}

                    // Positioned events
                    {day_events.into_iter().map(|ev| {
                        let color = ev.event_type.color();
                        let title = ev.title.clone();
                        let id = ev.id.clone();
                        let on_click = on_event_click;
                        let instance_date = current_date;

                        // Calculate position
                        let start_h = ev.start_hour().max(START_HOUR);
                        let start_m = ev.start_minute();
                        let end_h = ev.end_hour().min(END_HOUR);
                        let end_m = ev.end_minute();

                        let top_px = ((start_h - START_HOUR) * PIXELS_PER_HOUR) + (start_m * PIXELS_PER_HOUR / 60);
                        let end_offset = ((end_h - START_HOUR) * PIXELS_PER_HOUR) + (end_m * PIXELS_PER_HOUR / 60);
                        let height_px = end_offset.saturating_sub(top_px).max(20);

                        let time_range = ev.time_range_display();
                        let description = ev.description.clone().unwrap_or_default();
                        let location = ev.location.clone();

                        view! {
                            <div
                                class=style::day_event
                                style=format!("background-color: {}; top: {}px; height: {}px;", color, top_px, height_px)
                                on:click=move |_| {
                                    if let Some(cb) = on_click {
                                        cb.run((id.clone(), instance_date));
                                    }
                                }
                            >
                                <div class=style::day_event_title>{title}</div>
                                <div class=style::day_event_time>{time_range}</div>
                                {location.map(|loc| view! {
                                    <div class=style::day_event_location>{loc}</div>
                                })}
                                {(!description.is_empty()).then(|| view! {
                                    <div class=style::day_event_description>{description.clone()}</div>
                                })}
                            </div>
                        }
                    }).collect::<Vec<_>>()}
                </div>
            </div>
        </div>
    }
}
