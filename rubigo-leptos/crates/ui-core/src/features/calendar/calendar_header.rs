//! Calendar Header Component
//!
//! Navigation controls, view toggle, and work week toggle.

use chrono::{DateTime, Datelike, Duration, Utc};
use leptos::prelude::*;

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/features/calendar/calendar.module.css"
);

/// View mode for calendar
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum CalendarView {
    #[default]
    Month,
    Week,
    Day,
}

/// Calendar header with navigation and view controls
#[component]
pub fn CalendarHeader(
    /// Current displayed date
    current_date: DateTime<Utc>,
    /// Current view mode
    view: CalendarView,
    /// Work week mode (hide weekends)
    work_week: bool,
    /// Callback when view changes
    #[prop(optional)]
    on_view_change: Option<Callback<CalendarView>>,
    /// Callback when work week toggles
    #[prop(optional)]
    on_work_week_change: Option<Callback<bool>>,
    /// Callback for prev navigation (-1 week or month depending on view)
    #[prop(optional)]
    on_prev: Option<Callback<()>>,
    /// Callback for next navigation (+1 week or month depending on view)
    #[prop(optional)]
    on_next: Option<Callback<()>>,
    /// Callback for Today button
    #[prop(optional)]
    on_today: Option<Callback<()>>,
    /// Callback for New Event button
    #[prop(optional)]
    on_new_event: Option<Callback<()>>,
) -> impl IntoView {
    // Format header based on view mode
    let date_str = match view {
        CalendarView::Month => current_date.format("%B %Y").to_string(),
        CalendarView::Week => {
            // Show week range: "Dec 8 - 14, 2024"
            let week_start = current_date;
            let week_end = current_date + Duration::days(6);
            if week_start.month() == week_end.month() {
                format!(
                    "{} {} - {}, {}",
                    week_start.format("%b"),
                    week_start.day(),
                    week_end.day(),
                    week_start.year()
                )
            } else {
                format!(
                    "{} {} - {} {}, {}",
                    week_start.format("%b"),
                    week_start.day(),
                    week_end.format("%b"),
                    week_end.day(),
                    week_end.year()
                )
            }
        }
        CalendarView::Day => {
            // Show full date: "Thursday, December 12, 2024"
            current_date.format("%A, %B %e, %Y").to_string()
        }
    };

    // Navigation handlers
    let handle_prev = {
        let on_prev = on_prev;
        move |_| {
            if let Some(cb) = on_prev {
                cb.run(());
            }
        }
    };

    let handle_next = {
        let on_next = on_next;
        move |_| {
            if let Some(cb) = on_next {
                cb.run(());
            }
        }
    };

    let handle_today = {
        let on_today = on_today;
        move |_| {
            if let Some(cb) = on_today {
                cb.run(());
            }
        }
    };

    // View toggle
    let set_month_view = {
        let on_view_change = on_view_change;
        move |_| {
            if let Some(cb) = on_view_change {
                cb.run(CalendarView::Month);
            }
        }
    };

    let set_week_view = {
        let on_view_change = on_view_change;
        move |_| {
            if let Some(cb) = on_view_change {
                cb.run(CalendarView::Week);
            }
        }
    };

    let set_day_view = {
        let on_view_change = on_view_change;
        move |_| {
            if let Some(cb) = on_view_change {
                cb.run(CalendarView::Day);
            }
        }
    };

    // Work week toggle
    let toggle_work_week = {
        let on_work_week_change = on_work_week_change;
        let work_week = work_week;
        move |_| {
            if let Some(cb) = on_work_week_change {
                cb.run(!work_week);
            }
        }
    };

    // New event button handler
    let handle_new_event = {
        let on_new_event = on_new_event;
        move |_| {
            if let Some(cb) = on_new_event {
                cb.run(());
            }
        }
    };

    let month_btn_class = if view == CalendarView::Month {
        format!("{} {}", style::view_btn, style::view_btn_active)
    } else {
        style::view_btn.to_string()
    };

    let week_btn_class = if view == CalendarView::Week {
        format!("{} {}", style::view_btn, style::view_btn_active)
    } else {
        style::view_btn.to_string()
    };

    let day_btn_class = if view == CalendarView::Day {
        format!("{} {}", style::view_btn, style::view_btn_active)
    } else {
        style::view_btn.to_string()
    };

    view! {
        <div class=style::calendar_header>
            <div class=style::title_group>
                <h2 class=style::calendar_title>{date_str}</h2>
                <div class=style::nav_group>
                    <button class=style::nav_btn on:click=handle_prev>"←"</button>
                    <button class=style::nav_btn on:click=handle_today>"Today"</button>
                    <button class=style::nav_btn on:click=handle_next>"→"</button>
                </div>
            </div>

            <div class=style::controls>
                <label class=style::work_week_toggle>
                    <input
                        type="checkbox"
                        checked=work_week
                        on:change=toggle_work_week
                    />
                    <span>"Work Week"</span>
                </label>

                <div class=style::view_switcher>
                    <button class=month_btn_class on:click=set_month_view>"Month"</button>
                    <button class=week_btn_class on:click=set_week_view>"Week"</button>
                    <button class=day_btn_class on:click=set_day_view>"Day"</button>
                </div>

                <button class=style::new_event_btn on:click=handle_new_event>
                    <span>"+"</span>
                    <span>"New Event"</span>
                </button>
            </div>
        </div>
    }
}
