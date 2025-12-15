//! Week View Component
//!
//! Displays a weekly calendar with time-based event positioning.

use chrono::{Datelike, NaiveDate, Utc};
use leptos::prelude::*;

use super::calendar_types::{week_days, CalendarEvent};

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/features/calendar/calendar.module.css"
);

/// Hours to display in week view (6 AM to 10 PM)
const START_HOUR: u32 = 6;
const END_HOUR: u32 = 22;
const PIXELS_PER_HOUR: u32 = 60;

/// Week view with time-based event positioning
#[component]
pub fn WeekView(
    /// Current date (week containing this date is shown)
    current_date: NaiveDate,
    /// Events to display
    events: Vec<CalendarEvent>,
    /// Work week mode (hide weekends)
    #[prop(default = false)]
    work_week: bool,
    /// Callback when an event is clicked - receives (event_id, instance_date)
    #[prop(optional)]
    on_event_click: Option<Callback<(String, NaiveDate)>>,
) -> impl IntoView {
    let today = Utc::now().date_naive();
    let days = week_days(current_date, work_week);
    let hours: Vec<u32> = (START_HOUR..END_HOUR).collect();

    let view_class = if work_week {
        format!("{} {}", style::week_view, style::work_week)
    } else {
        style::week_view.to_string()
    };

    view! {
        <div class=view_class>
            // Week header
            <div class=style::week_header>
                <div class=style::week_time_gutter></div>
                {days.iter().map(|day| {
                    let day_name = day.format("%a").to_string();
                    let day_num = day.day();
                    let is_today = *day == today;
                    let class = if is_today {
                        format!("{} {}", style::week_day_header, style::today)
                    } else {
                        style::week_day_header.to_string()
                    };

                    view! {
                        <div class=class>
                            <span class=style::week_day_name>{day_name}</span>
                            <span class=style::week_day_num>{day_num}</span>
                        </div>
                    }
                }).collect::<Vec<_>>()}
            </div>

            // Week body
            <div class=style::week_body>
                // Time column
                <div class=style::week_time_column>
                    {hours.iter().map(|hour| {
                        let label = if *hour < 12 {
                            format!("{} AM", hour)
                        } else if *hour == 12 {
                            "12 PM".to_string()
                        } else {
                            format!("{} PM", hour - 12)
                        };

                        view! {
                            <div class=style::week_time_slot>
                                <span>{label}</span>
                            </div>
                        }
                    }).collect::<Vec<_>>()}
                </div>

                // Day columns
                {days.iter().map(|day| {
                    let is_today = *day == today;
                    let column_class = if is_today {
                        format!("{} {}", style::week_day_column, style::today)
                    } else {
                        style::week_day_column.to_string()
                    };

                    // Filter events for this day
                    let day_events: Vec<&CalendarEvent> = events.iter()
                        .filter(|e| e.occurs_on(*day))
                        .collect();

                    view! {
                        <div class=column_class>
                            // Hour grid lines
                            {hours.iter().map(|_| {
                                view! { <div class=style::week_hour_line></div> }
                            }).collect::<Vec<_>>()}

                            // Positioned events
                            {day_events.into_iter().map(|ev| {
                                let color = ev.event_type.color();
                                let title = ev.title.clone();
                                let id = ev.id.clone();
                                let on_click = on_event_click;
                                let instance_date = *day;

                                // Calculate position
                                let start_h = ev.start_hour().max(START_HOUR);
                                let start_m = ev.start_minute();
                                let end_h = ev.end_hour().min(END_HOUR);
                                let end_m = ev.end_minute();

                                let top_px = ((start_h - START_HOUR) * PIXELS_PER_HOUR) + (start_m * PIXELS_PER_HOUR / 60);
                                let end_offset = ((end_h - START_HOUR) * PIXELS_PER_HOUR) + (end_m * PIXELS_PER_HOUR / 60);
                                let height_px = end_offset.saturating_sub(top_px).max(20);

                                let time_range = ev.time_range_display();

                                view! {
                                    <div
                                        class=style::week_event
                                        style=format!("background-color: {}; top: {}px; height: {}px;", color, top_px, height_px)
                                        on:click=move |_| {
                                            if let Some(cb) = on_click {
                                                cb.run((id.clone(), instance_date));
                                            }
                                        }
                                    >
                                        <div class=style::week_event_title>{title}</div>
                                        <div class=style::week_event_time>{time_range}</div>
                                    </div>
                                }
                            }).collect::<Vec<_>>()}
                        </div>
                    }
                }).collect::<Vec<_>>()}
            </div>
        </div>
    }
}
