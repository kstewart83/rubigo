//! Month View Component
//!
//! Displays a monthly calendar grid with events.

use chrono::{Datelike, NaiveDate, Utc};
use leptos::prelude::*;

use super::calendar_types::{month_grid_days, CalendarEvent};

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/features/calendar/calendar.module.css"
);

/// Day header labels
const WEEKDAY_HEADERS: [&str; 7] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WORK_WEEK_HEADERS: [&str; 5] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/// Month view calendar grid
#[component]
pub fn MonthView(
    /// Current year
    year: i32,
    /// Current month (1-12)
    month: u32,
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
    let days = month_grid_days(year, month, work_week);
    let headers = if work_week {
        &WORK_WEEK_HEADERS[..]
    } else {
        &WEEKDAY_HEADERS[..]
    };

    let grid_class = if work_week {
        format!("{} {}", style::month_grid, style::work_week)
    } else {
        style::month_grid.to_string()
    };

    view! {
        <div class=grid_class>
            // Day headers
            {headers.iter().map(|h| {
                view! { <div class=style::day_header>{*h}</div> }
            }).collect::<Vec<_>>()}

            // Day cells
            {days.into_iter().map(|date| {
                let is_current_month = date.month() == month;
                let is_today = date == today;

                let cell_class = if !is_current_month {
                    format!("{} {}", style::day_cell, style::outside_month)
                } else if is_today {
                    format!("{} {}", style::day_cell, style::today)
                } else {
                    style::day_cell.to_string()
                };

                // Filter events for this day
                let day_events: Vec<&CalendarEvent> = events.iter()
                    .filter(|e| e.occurs_on(date))
                    .collect();

                view! {
                    <div class=cell_class>
                        <div class=style::day_number>
                            <span>{date.day()}</span>
                        </div>
                        <div class=style::day_events>
                            {day_events.into_iter().map(|ev| {
                                let color = ev.event_type.color();
                                let title = ev.title.clone();
                                let id = ev.id.clone();
                                let on_click = on_event_click;
                                let instance_date = date;

                                view! {
                                    <div
                                        class=style::event_pill
                                        style=format!("background-color: {}", color)
                                        on:click=move |_| {
                                            if let Some(cb) = on_click {
                                                cb.run((id.clone(), instance_date));
                                            }
                                        }
                                    >
                                        {title}
                                    </div>
                                }
                            }).collect::<Vec<_>>()}
                        </div>
                    </div>
                }
            }).collect::<Vec<_>>()}
        </div>
    }
}
