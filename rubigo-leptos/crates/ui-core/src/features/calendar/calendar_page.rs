//! Calendar Page Component
//!
//! Main calendar page with header, view switching, and event display.

use chrono::{Datelike, Duration, NaiveDate, TimeZone, Utc};
use leptos::prelude::*;
use leptos_router::hooks::{use_navigate, use_query_map};

use super::calendar_header::{CalendarHeader, CalendarView};
use super::calendar_types::{CalendarEvent, RecurrenceFrequency};
use super::day_view::DayView;
use super::event_modal::EventModal;
use super::month_view::MonthView;
use super::week_view::WeekView;
use crate::elements::SlidePanel;
use crate::primitives::{
    get_browser_timezone, timezone_display_name, timezone_offset_minutes, Button, ButtonVariant,
};

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/features/calendar/calendar.module.css"
);

/// Build calendar URL with query params
fn build_calendar_url(
    year: i32,
    month: u32,
    view: CalendarView,
    work_week: bool,
    week_start: Option<NaiveDate>,
) -> String {
    let view_str = match view {
        CalendarView::Month => "month",
        CalendarView::Week => "week",
        CalendarView::Day => "day",
    };
    let ww_param = if work_week { "&workweek=on" } else { "" };
    let week_param = match (view, week_start) {
        (CalendarView::Week, Some(ws)) | (CalendarView::Day, Some(ws)) => {
            format!("&week={}", ws.format("%Y-%m-%d"))
        }
        _ => String::new(),
    };
    format!(
        "/calendar?year={}&month={}&view={}{}{}",
        year, month, view_str, ww_param, week_param
    )
}

/// Get the Sunday that starts the week containing the given date
fn get_week_start(date: NaiveDate) -> NaiveDate {
    let days_from_sunday = date.weekday().num_days_from_sunday();
    date - Duration::days(days_from_sunday as i64)
}

/// Main calendar page component
#[component]
pub fn CalendarPage(
    /// Events to display
    #[prop(default = vec![])]
    initial_events: Vec<CalendarEvent>,
    /// Available people for organizer/participant selection
    #[prop(default = vec![])]
    available_people: Vec<crate::primitives::PersonOption>,
) -> impl IntoView {
    let query = use_query_map();
    let navigate = use_navigate();
    let now = Utc::now();

    // Convert to signal for reactivity (new events can be added)
    let events = RwSignal::new(initial_events);
    let today = now.date_naive();

    // Parse query params for initial state
    let initial_year: i32 = query
        .get()
        .get("year")
        .and_then(|y| y.parse().ok())
        .unwrap_or(now.year());
    let initial_month: u32 = query
        .get()
        .get("month")
        .and_then(|m| m.parse().ok())
        .unwrap_or(now.month());
    let initial_view = match query.get().get("view").as_deref() {
        Some("week") => CalendarView::Week,
        Some("day") => CalendarView::Day,
        _ => CalendarView::Month,
    };
    let initial_work_week = query
        .get()
        .get("workweek")
        .map(|w| w == "on")
        .unwrap_or(false);
    // Parse week start from query param or default to current week
    let initial_week_start = query
        .get()
        .get("week")
        .and_then(|w| NaiveDate::parse_from_str(w.as_str(), "%Y-%m-%d").ok())
        .unwrap_or_else(|| get_week_start(today));

    // Reactive state
    let current_year = RwSignal::new(initial_year);
    let current_month = RwSignal::new(initial_month);
    let view_mode = RwSignal::new(initial_view);
    let work_week = RwSignal::new(initial_work_week);
    let week_start = RwSignal::new(initial_week_start);
    let selected_event_id = RwSignal::new(Option::<String>::None);
    let panel_open = RwSignal::new(false);
    let show_event_modal = RwSignal::new(false);
    let editing_event: RwSignal<Option<CalendarEvent>> = RwSignal::new(None);
    // Delete confirmation state
    let show_delete_dialog = RwSignal::new(false);
    let delete_instance_date: RwSignal<Option<NaiveDate>> = RwSignal::new(None);

    // Navigation callbacks
    let nav1 = navigate.clone();
    let on_prev = Callback::new(move |_: ()| {
        let view = view_mode.get();
        match view {
            CalendarView::Month => {
                // Navigate to previous month
                let year = current_year.get();
                let month = current_month.get();
                let (new_year, new_month) = if month == 1 {
                    (year - 1, 12)
                } else {
                    (year, month - 1)
                };
                current_year.set(new_year);
                current_month.set(new_month);
                let url = build_calendar_url(new_year, new_month, view, work_week.get(), None);
                nav1(&url, Default::default());
            }
            CalendarView::Week | CalendarView::Day => {
                // Navigate to previous week or day
                let days_back = if view == CalendarView::Day { 1 } else { 7 };
                let ws = week_start.get();
                let new_ws = ws - Duration::days(days_back);
                week_start.set(new_ws);
                let url = build_calendar_url(
                    new_ws.year(),
                    new_ws.month(),
                    view,
                    work_week.get(),
                    Some(new_ws),
                );
                nav1(&url, Default::default());
            }
        }
    });

    let nav2 = navigate.clone();
    let on_next = Callback::new(move |_: ()| {
        let view = view_mode.get();
        match view {
            CalendarView::Month => {
                // Navigate to next month
                let year = current_year.get();
                let month = current_month.get();
                let (new_year, new_month) = if month == 12 {
                    (year + 1, 1)
                } else {
                    (year, month + 1)
                };
                current_year.set(new_year);
                current_month.set(new_month);
                let url = build_calendar_url(new_year, new_month, view, work_week.get(), None);
                nav2(&url, Default::default());
            }
            CalendarView::Week | CalendarView::Day => {
                // Navigate to next week or day
                let days_forward = if view == CalendarView::Day { 1 } else { 7 };
                let ws = week_start.get();
                let new_ws = ws + Duration::days(days_forward);
                week_start.set(new_ws);
                let url = build_calendar_url(
                    new_ws.year(),
                    new_ws.month(),
                    view,
                    work_week.get(),
                    Some(new_ws),
                );
                nav2(&url, Default::default());
            }
        }
    });

    let nav3 = navigate.clone();
    let on_today = Callback::new(move |_: ()| {
        let view = view_mode.get();
        let today = Utc::now().date_naive();
        current_year.set(today.year());
        current_month.set(today.month());
        // For Day view, week_start stores the current day; for Week view, the week's Sunday
        if view == CalendarView::Day {
            week_start.set(today);
        } else {
            week_start.set(get_week_start(today));
        }
        let ws = if view == CalendarView::Week || view == CalendarView::Day {
            Some(week_start.get())
        } else {
            None
        };
        let url = build_calendar_url(today.year(), today.month(), view, work_week.get(), ws);
        nav3(&url, Default::default());
    });

    let nav4 = navigate.clone();
    let on_view_change = Callback::new(move |new_view: CalendarView| {
        view_mode.set(new_view);
        let year = current_year.get();
        let month = current_month.get();
        // When switching to Day view, default to today
        let today = Utc::now().date_naive();
        let ws = match new_view {
            CalendarView::Day => {
                week_start.set(today);
                Some(today)
            }
            CalendarView::Week => Some(week_start.get()),
            CalendarView::Month => None,
        };
        let url = build_calendar_url(year, month, new_view, work_week.get(), ws);
        nav4(&url, Default::default());
    });

    let nav5 = navigate.clone();
    let on_work_week_change = Callback::new(move |new_value: bool| {
        work_week.set(new_value);
        let view = view_mode.get();
        let ws = if view == CalendarView::Week || view == CalendarView::Day {
            Some(week_start.get())
        } else {
            None
        };
        let url = build_calendar_url(current_year.get(), current_month.get(), view, new_value, ws);
        nav5(&url, Default::default());
    });

    let on_event_click = Callback::new(move |(event_id, instance_date): (String, NaiveDate)| {
        selected_event_id.set(Some(event_id));
        delete_instance_date.set(Some(instance_date));
        panel_open.set(true);
    });

    let on_new_event = Callback::new(move |_: ()| {
        editing_event.set(None); // Clear any editing state
        show_event_modal.set(true);
    });

    // Callback to open edit modal
    let on_edit_event = Callback::new(move |event: CalendarEvent| {
        editing_event.set(Some(event));
        panel_open.set(false); // Close details panel
        show_event_modal.set(true);
    });

    // Callback when event is saved from modal (handles both create and edit)
    let on_event_save = Callback::new(move |saved_event: CalendarEvent| {
        events.update(|evts| {
            // Check if this is an update (event with same ID exists)
            if let Some(idx) = evts.iter().position(|e| e.id == saved_event.id) {
                evts[idx] = saved_event;
            } else {
                evts.push(saved_event);
            }
        });
        editing_event.set(None); // Clear editing state
    });

    // Find selected event for details panel
    let selected_event = Memo::new(move |_| {
        selected_event_id
            .get()
            .and_then(|id| events.get().into_iter().find(|e| e.id == id))
    });

    // Sync panel_open -> selected_event_id when closed
    Effect::new(move |_| {
        if !panel_open.get() {
            selected_event_id.set(None);
        }
    });

    view! {
        <div class=style::calendar_container>
            {move || {
                let year = current_year.get();
                let month = current_month.get();
                let view = view_mode.get();
                let ww = work_week.get();
                let ws = week_start.get();

                // For header: use month first day for month view, week start for week view, current day for day view
                let header_date = match view {
                    CalendarView::Month => Utc.with_ymd_and_hms(year, month, 1, 0, 0, 0).unwrap(),
                    CalendarView::Week => ws.and_hms_opt(0, 0, 0).unwrap().and_utc(),
                    CalendarView::Day => ws.and_hms_opt(0, 0, 0).unwrap().and_utc(),
                };

                view! {
                    <CalendarHeader
                        current_date=header_date
                        view=view
                        work_week=ww
                        on_prev=on_prev
                        on_next=on_next
                        on_today=on_today
                        on_view_change=on_view_change
                        on_work_week_change=on_work_week_change
                        on_new_event=on_new_event
                    />
                }
            }}

            <div class=style::calendar_main>
                {move || {
                    let year = current_year.get();
                    let month = current_month.get();
                    let view = view_mode.get();
                    let ww = work_week.get();
                    let ws = week_start.get();
                    let evts = events.get();

                    match view {
                        CalendarView::Month => {
                            view! {
                                <MonthView
                                    year=year
                                    month=month
                                    events=evts
                                    work_week=ww
                                    on_event_click=on_event_click
                                />
                            }.into_any()
                        }
                        CalendarView::Week => {
                            view! {
                                <WeekView
                                    current_date=ws
                                    events=evts
                                    work_week=ww
                                    on_event_click=on_event_click
                                />
                            }.into_any()
                        }
                        CalendarView::Day => {
                            view! {
                                <DayView
                                    current_date=ws
                                    events=evts
                                    on_event_click=on_event_click
                                />
                            }.into_any()
                        }
                    }
                }}
            </div>

            // Event Details Panel
            <SlidePanel
                open=panel_open
                title="Event Details".to_string()
            >
                {move || {
                    if let Some(event) = selected_event.get() {
                        view! {
                            <div class=style::event_details>
                                // Title
                                <h2 class=style::event_title>{event.title.clone()}</h2>

                                // Type badge
                                <div
                                    class=style::event_type_badge
                                    style=format!("background-color: {}", event.event_type.color())
                                >
                                    {event.event_type.display_name()}
                                </div>

                                <div class=style::detail_divider></div>

                                // Date & Time with timezone information
                                <div class=style::detail_section>
                                    <div class=style::detail_row>
                                        <span class=style::detail_label>"Date"</span>
                                        <span class=style::detail_value>
                                            {event.start_time.format("%A, %B %e, %Y").to_string()}
                                        </span>
                                    </div>

                                    // Reference timezone time (what the organizer set)
                                    <div class=style::detail_row>
                                        <span class=style::detail_label>"Time"</span>
                                        <span class=style::detail_value>
                                            {format!("{} ({})",
                                                event.time_range_display(),
                                                timezone_display_name(&event.timezone)
                                            )}
                                        </span>
                                    </div>

                                    // Local time conversion (only if timezone differs)
                                    {
                                        let local_tz = get_browser_timezone();
                                        let event_tz = event.timezone.clone();

                                        if local_tz != event_tz {
                                            // Calculate time difference
                                            let event_offset = timezone_offset_minutes(&event_tz);
                                            let local_offset = timezone_offset_minutes(&local_tz);
                                            let offset_diff = local_offset - event_offset;

                                            // Get event start/end hours
                                            let start_hour = event.start_time.format("%H").to_string().parse::<i32>().unwrap_or(9);
                                            let start_min = event.start_time.format("%M").to_string().parse::<i32>().unwrap_or(0);
                                            let end_hour = event.end_time.format("%H").to_string().parse::<i32>().unwrap_or(10);
                                            let end_min = event.end_time.format("%M").to_string().parse::<i32>().unwrap_or(0);

                                            // Convert to local time
                                            let convert_time = |hour: i32, min: i32| -> (i32, i32) {
                                                let total_mins = hour * 60 + min + offset_diff;
                                                let mut h = (total_mins / 60) % 24;
                                                if h < 0 { h += 24; }
                                                let m = total_mins.rem_euclid(60);
                                                (h, m)
                                            };

                                            let format_time = |h: i32, m: i32| -> String {
                                                let (h12, period) = if h == 0 { (12, "AM") }
                                                    else if h < 12 { (h, "AM") }
                                                    else if h == 12 { (12, "PM") }
                                                    else { (h - 12, "PM") };
                                                format!("{}:{:02} {}", h12, m, period)
                                            };

                                            let (local_start_h, local_start_m) = convert_time(start_hour, start_min);
                                            let (local_end_h, local_end_m) = convert_time(end_hour, end_min);

                                            let local_time_str = format!("{} - {} ({})",
                                                format_time(local_start_h, local_start_m),
                                                format_time(local_end_h, local_end_m),
                                                timezone_display_name(&local_tz)
                                            );

                                            Some(view! {
                                                <div class=style::local_time_row>
                                                    <span class=style::local_time_label>"Your local time"</span>
                                                    <span class=style::local_time_value>
                                                        {local_time_str}
                                                    </span>
                                                </div>
                                            })
                                        } else {
                                            None
                                        }
                                    }
                                </div>

                                // Recurrence (if set)
                                {(event.recurrence != RecurrenceFrequency::None).then(|| {
                                    let recurrence_text = match event.recurrence {
                                        RecurrenceFrequency::Daily => "Daily",
                                        RecurrenceFrequency::Weekly => {
                                            if event.recurrence_days.is_empty() {
                                                "Weekly"
                                            } else {
                                                "Weekly (specific days)"
                                            }
                                        },
                                        RecurrenceFrequency::Monthly => "Monthly",
                                        RecurrenceFrequency::Yearly => "Yearly",
                                        RecurrenceFrequency::None => "",
                                    };
                                    let days_text = if !event.recurrence_days.is_empty() {
                                        Some(event.recurrence_days.join(", "))
                                    } else {
                                        None
                                    };
                                    view! {
                                        <>
                                            <div class=style::detail_divider></div>
                                            <div class=style::detail_row>
                                                <span class=style::detail_label>"Recurrence"</span>
                                                <span class=style::detail_value>{recurrence_text}</span>
                                                {days_text.map(|days| view! {
                                                    <span class=style::detail_value_secondary>{days}</span>
                                                })}
                                            </div>
                                        </>
                                    }
                                })}

                                // Location (if present)
                                {event.location.as_ref().map(|loc| {
                                    view! {
                                        <>
                                            <div class=style::detail_divider></div>
                                            <div class=style::detail_row>
                                                <span class=style::detail_label>"Location"</span>
                                                <span class=style::detail_value>{loc.clone()}</span>
                                            </div>
                                        </>
                                    }
                                })}

                                // Description (if present)
                                {event.description.as_ref().map(|desc| {
                                    view! {
                                        <>
                                            <div class=style::detail_divider></div>
                                            <div class=style::detail_row>
                                                <span class=style::detail_label>"Description"</span>
                                                <p class=style::description_text>{desc.clone()}</p>
                                            </div>
                                        </>
                                    }
                                })}

                                // Organizers (if any)
                                {(!event.organizers.is_empty()).then(|| {
                                    let organizers = event.organizers.clone();
                                    view! {
                                        <>
                                            <div class=style::detail_divider></div>
                                            <div class=style::detail_row>
                                                <span class=style::detail_label>"Organizers"</span>
                                                <div class=style::participants_list>
                                                    {organizers.into_iter().map(|p| {
                                                        let initial = p.name.chars().next().unwrap_or('?').to_uppercase().to_string();
                                                        view! {
                                                            <div class=style::participant_chip>
                                                                <span class=style::participant_avatar>{initial}</span>
                                                                <span>{p.name}</span>
                                                            </div>
                                                        }
                                                    }).collect::<Vec<_>>()}
                                                </div>
                                            </div>
                                        </>
                                    }
                                })}

                                // Participants (if any)
                                {(!event.participants.is_empty()).then(|| {
                                    let participants = event.participants.clone();
                                    view! {
                                        <>
                                            <div class=style::detail_divider></div>
                                            <div class=style::detail_row>
                                                <span class=style::detail_label>"Participants"</span>
                                                <div class=style::participants_list>
                                                    {participants.into_iter().map(|p| {
                                                        let initial = p.name.chars().next().unwrap_or('?').to_uppercase().to_string();
                                                        view! {
                                                            <div class=style::participant_chip>
                                                                <span class=style::participant_avatar>{initial}</span>
                                                                <span>{p.name}</span>
                                                            </div>
                                                        }
                                                    }).collect::<Vec<_>>()}
                                                </div>
                                            </div>
                                        </>
                                    }
                                })}

                                // Action buttons at bottom
                                <div class=style::detail_divider></div>
                                <div class=style::detail_actions>
                                    {
                                        let event_for_edit = event.clone();
                                        let handle_edit = Callback::new(move |_: web_sys::MouseEvent| {
                                            on_edit_event.run(event_for_edit.clone());
                                        });
                                        view! {
                                            <Button variant=ButtonVariant::Secondary on_click=handle_edit>
                                                "Edit Event"
                                            </Button>
                                        }
                                    }
                                    {
                                        let event_is_recurring = event.is_recurring();
                                        let event_id_for_delete = event.id.clone();
                                        let handle_delete = Callback::new(move |_: web_sys::MouseEvent| {
                                            if event_is_recurring {
                                                // Show dialog for recurring events
                                                show_delete_dialog.set(true);
                                            } else {
                                                // Direct delete for non-recurring
                                                // Mark event as deleted
                                                events.update(|evts| {
                                                    if let Some(evt) = evts.iter_mut().find(|e| e.id == event_id_for_delete) {
                                                        evt.delete();
                                                    }
                                                });
                                                panel_open.set(false);
                                                selected_event_id.set(None);
                                            }
                                        });
                                        view! {
                                            <Button variant=ButtonVariant::Danger on_click=handle_delete>
                                                "Delete"
                                            </Button>
                                        }
                                    }
                                </div>
                            </div>
                        }.into_any()
                    } else {
                        view! { <p>"No event selected"</p> }.into_any()
                    }
                }}
            </SlidePanel>

            // Event creation/edit modal
            {move || {
                let people = available_people.clone();
                match editing_event.get() {
                    Some(evt) => view! {
                        <EventModal
                            open=show_event_modal
                            event=evt
                            available_people=people
                            on_save=on_event_save
                        />
                    }.into_any(),
                    None => view! {
                        <EventModal
                            open=show_event_modal
                            available_people=people
                            on_save=on_event_save
                        />
                    }.into_any(),
                }
            }}

            // Delete confirmation dialog for recurring events
            {move || {
                let is_open = show_delete_dialog.get();
                if is_open {
                    let selected_id = selected_event_id.get();
                    let event = selected_id.as_ref().and_then(|id| {
                        events.get().into_iter().find(|e| &e.id == id)
                    });

                    if let Some(event) = event {
                        let event_id = event.id.clone();
                        let event_id2 = event.id.clone();
                        let event_title = event.title.clone();

                        // Get the instance date from when the user clicked on the event
                        let instance_date = delete_instance_date.get()
                            .unwrap_or_else(|| event.start_time.date_naive());

                        let handle_cancel = Callback::new(move |_: web_sys::MouseEvent| {
                            show_delete_dialog.set(false);
                        });

                        let handle_delete_instance = Callback::new(move |_: web_sys::MouseEvent| {
                            // Cancel just this instance
                            events.update(|evts| {
                                if let Some(evt) = evts.iter_mut().find(|e| e.id == event_id) {
                                    evt.cancel_instance(instance_date);
                                }
                            });
                            show_delete_dialog.set(false);
                            panel_open.set(false);
                            selected_event_id.set(None);
                        });

                        let handle_delete_series = Callback::new(move |_: web_sys::MouseEvent| {
                            // Delete entire series
                            events.update(|evts| {
                                if let Some(evt) = evts.iter_mut().find(|e| e.id == event_id2) {
                                    evt.delete();
                                }
                            });
                            show_delete_dialog.set(false);
                            panel_open.set(false);
                            selected_event_id.set(None);
                        });

                        view! {
                            <div class=style::delete_dialog_overlay>
                                <div class=style::delete_dialog>
                                    <h3 class=style::delete_dialog_title>"Delete Recurring Event"</h3>
                                    <p class=style::delete_dialog_text>
                                        {format!("\"{}\" is a recurring event. What would you like to delete?", event_title)}
                                    </p>
                                    <div class=style::delete_dialog_actions>
                                        <Button variant=ButtonVariant::Secondary on_click=handle_cancel>
                                            "Cancel"
                                        </Button>
                                        <Button variant=ButtonVariant::Secondary on_click=handle_delete_instance>
                                            "Just This Occurrence"
                                        </Button>
                                        <Button variant=ButtonVariant::Danger on_click=handle_delete_series>
                                            "All Occurrences"
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        }.into_any()
                    } else {
                        view! { <></> }.into_any()
                    }
                } else {
                    view! { <></> }.into_any()
                }
            }}
        </div>
    }
}
