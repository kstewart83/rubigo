//! Event Modal Component
//!
//! Modal form for creating and editing calendar events.

use chrono::{NaiveDate, NaiveTime, TimeZone, Utc};
use leptos::prelude::*;

use crate::elements::Modal;
use crate::primitives::{
    get_browser_timezone, timezone_display_name, timezone_offset_minutes, Button, ButtonVariant,
    Checkbox, DateInput, Input, PersonOption, PersonSearch, Select, SelectOption, TimeInput,
    TimezoneSelect,
};

use super::calendar_types::{CalendarEvent, EventType, ParticipantInfo, RecurrenceFrequency};

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/features/calendar/event_modal.module.css"
);

/// Event modal for creating/editing events
#[component]
pub fn EventModal(
    /// Whether the modal is open
    open: RwSignal<bool>,
    /// Existing event for editing (None = create new)
    #[prop(optional)]
    event: Option<CalendarEvent>,
    /// Available people for organizer/participants selection
    #[prop(default = vec![])]
    available_people: Vec<PersonOption>,
    /// Callback on save
    #[prop(optional)]
    on_save: Option<Callback<CalendarEvent>>,
) -> impl IntoView {
    // Determine if editing
    let is_edit = event.is_some();
    let title_text = if is_edit { "Edit Event" } else { "New Event" };

    // Store callback using StoredValue for Fn compatibility
    let on_save_stored = StoredValue::new(on_save);
    let event_id_stored = StoredValue::new(event.as_ref().map(|e| e.id.clone()));

    // Form state
    let now = Utc::now();
    let event_ref = event.clone();

    let title = RwSignal::new(
        event_ref
            .as_ref()
            .map(|e| e.title.clone())
            .unwrap_or_default(),
    );
    let description = RwSignal::new(
        event_ref
            .as_ref()
            .and_then(|e| e.description.clone())
            .unwrap_or_default(),
    );
    let start_date = RwSignal::new(
        event_ref
            .as_ref()
            .map(|e| e.start_time.format("%Y-%m-%d").to_string())
            .unwrap_or_else(|| now.format("%Y-%m-%d").to_string()),
    );
    let start_time = RwSignal::new(
        event_ref
            .as_ref()
            .map(|e| e.start_time.format("%H:%M").to_string())
            .unwrap_or_else(|| "09:00".to_string()),
    );
    let end_date = RwSignal::new(
        event_ref
            .as_ref()
            .map(|e| e.end_time.format("%Y-%m-%d").to_string())
            .unwrap_or_else(|| now.format("%Y-%m-%d").to_string()),
    );
    let end_time = RwSignal::new(
        event_ref
            .as_ref()
            .map(|e| e.end_time.format("%H:%M").to_string())
            .unwrap_or_else(|| "10:00".to_string()),
    );
    let all_day = RwSignal::new(false);
    let business_days_only = RwSignal::new(true); // Default to true when All Day is selected
    let event_type = RwSignal::new(
        event_ref
            .as_ref()
            .map(|e| event_type_to_string(e.event_type))
            .unwrap_or_else(|| "meeting".to_string()),
    );
    let recurrence = RwSignal::new(
        event_ref
            .as_ref()
            .map(|e| recurrence_to_string(e.recurrence))
            .unwrap_or_else(|| "none".to_string()),
    );
    let recurrence_days: RwSignal<Vec<String>> = RwSignal::new(
        event_ref
            .as_ref()
            .map(|e| e.recurrence_days.clone())
            .unwrap_or_default(),
    );
    let recurrence_end_date = RwSignal::new(
        event_ref
            .as_ref()
            .and_then(|e| {
                e.recurrence_until
                    .map(|dt| dt.format("%Y-%m-%d").to_string())
            })
            .unwrap_or_default(),
    );
    let location = RwSignal::new(
        event_ref
            .as_ref()
            .and_then(|e| e.location.clone())
            .unwrap_or_default(),
    );
    let timezone = RwSignal::new(
        event_ref
            .as_ref()
            .map(|e| e.timezone.clone())
            .unwrap_or_else(|| "America/New_York".to_string()),
    );
    let organizer_ids: RwSignal<Vec<String>> = RwSignal::new(
        event_ref
            .as_ref()
            .map(|e| {
                e.organizers
                    .iter()
                    .map(|o| o.id.clone())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default(),
    );
    let participant_ids: RwSignal<Vec<String>> = RwSignal::new(
        event_ref
            .as_ref()
            .map(|e| {
                e.participants
                    .iter()
                    .map(|p| p.id.clone())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default(),
    );

    // Reset form when modal opens (for new event creation)
    Effect::new(move |_| {
        if open.get() && !is_edit {
            // Reset all form fields to defaults when opening for new event
            let now = Utc::now();
            title.set(String::new());
            description.set(String::new());
            start_date.set(now.format("%Y-%m-%d").to_string());
            start_time.set("09:00".to_string());
            end_date.set(now.format("%Y-%m-%d").to_string());
            end_time.set("10:00".to_string());
            all_day.set(false);
            business_days_only.set(true);
            event_type.set("meeting".to_string());
            recurrence.set("none".to_string());
            recurrence_days.set(vec![]);
            recurrence_end_date.set(String::new());
            location.set(String::new());
            timezone.set("America/New_York".to_string());
            organizer_ids.set(vec![]);
            participant_ids.set(vec![]);
        }
    });

    // Clone available_people for the PersonSearch components (need multiple copies due to move semantics)
    // Use StoredValue to allow multiple uses in the view without moving
    let people_for_organizers = StoredValue::new(available_people.clone());
    let people_for_participants = StoredValue::new(available_people.clone());

    // Store available_people for use in closures
    let people_stored = StoredValue::new(available_people);

    // Event type options - stored to avoid move issues in closures
    let event_type_options = StoredValue::new(vec![
        SelectOption::new("meeting", "Meeting"),
        SelectOption::new("standup", "Standup"),
        SelectOption::new("all-hands", "All Hands"),
        SelectOption::new("1:1", "One on One"),
        SelectOption::new("training", "Training"),
        SelectOption::new("interview", "Interview"),
        SelectOption::new("review", "Review"),
        SelectOption::new("planning", "Planning"),
        SelectOption::new("conference", "Conference"),
        SelectOption::new("holiday", "Holiday"),
    ]);

    // Recurrence options - stored to avoid move issues in closures
    let recurrence_options = StoredValue::new(vec![
        SelectOption::new("none", "Does not repeat"),
        SelectOption::new("daily", "Daily"),
        SelectOption::new("weekly", "Weekly"),
        SelectOption::new("monthly", "Monthly"),
        SelectOption::new("yearly", "Yearly"),
    ]);

    // Handle save - use stored values to make closure Fn instead of FnOnce
    let handle_save = Callback::new(move |_: web_sys::MouseEvent| {
        // Validate title is not empty
        let title_val = title.get();
        if title_val.trim().is_empty() {
            // TODO: Show validation error to user
            return;
        }

        // Parse dates and times
        let start = parse_datetime(&start_date.get(), &start_time.get());
        let end = parse_datetime(&end_date.get(), &end_time.get());

        if let (Some(start_dt), Some(end_dt)) = (start, end) {
            // Get event ID using with_value to avoid consuming StoredValue
            let id = event_id_stored.with_value(|opt_id| {
                opt_id
                    .clone()
                    .unwrap_or_else(|| format!("event_{}", Utc::now().timestamp()))
            });
            let mut new_event = CalendarEvent::new(id, title.get(), start_dt, end_dt);
            new_event.description = Some(description.get()).filter(|d| !d.is_empty());
            new_event.location = Some(location.get()).filter(|l| !l.is_empty());
            new_event.event_type = string_to_event_type(&event_type.get());
            new_event.recurrence = string_to_recurrence(&recurrence.get());
            new_event.recurrence_days = recurrence_days.get();
            new_event.recurrence_until = {
                let end_str = recurrence_end_date.get();
                if end_str.is_empty() {
                    None
                } else {
                    NaiveDate::parse_from_str(&end_str, "%Y-%m-%d")
                        .ok()
                        .map(|d| d.and_hms_opt(23, 59, 59).unwrap().and_utc())
                }
            };
            new_event.timezone = timezone.get();

            // Map organizer/participant IDs to ParticipantInfo
            people_stored.with_value(|people| {
                new_event.organizers = organizer_ids
                    .get()
                    .iter()
                    .filter_map(|id| {
                        people
                            .iter()
                            .find(|p| &p.id == id)
                            .map(|p| ParticipantInfo::new(&p.id, &p.name))
                    })
                    .collect();
                new_event.participants = participant_ids
                    .get()
                    .iter()
                    .filter_map(|id| {
                        people
                            .iter()
                            .find(|p| &p.id == id)
                            .map(|p| ParticipantInfo::new(&p.id, &p.name))
                    })
                    .collect();
            });

            // Call on_save if provided
            on_save_stored.with_value(|opt_cb| {
                if let Some(cb) = opt_cb {
                    cb.run(new_event.clone());
                }
            });
            open.set(false);
        }
    });

    let handle_cancel = Callback::new(move |_: web_sys::MouseEvent| {
        open.set(false);
    });

    view! {
        <Modal open=open title=title_text.to_string()>
            <div class=style::event_form>
                <div class=style::form_group>
                    <label class=style::form_label>"Title"</label>
                    <Input value=title placeholder="Event title" />
                </div>

                <div class=style::form_group>
                    <label class=style::form_label>"Description"</label>
                    <textarea
                        class=style::description_textarea
                        placeholder="Add description..."
                        prop:value=move || description.get()
                        on:input=move |ev| description.set(event_target_value(&ev))
                        rows="3"
                    ></textarea>
                </div>

                // All Day options row
                <div class=style::all_day_row>
                    <Checkbox checked=all_day label="All day" />
                    {move || {
                        if all_day.get() {
                            view! {
                                <Checkbox checked=business_days_only label="Business days only" />
                            }.into_any()
                        } else {
                            view! { <></> }.into_any()
                        }
                    }}
                </div>

                // Time inputs - disabled when all_day is checked
                {move || {
                    let is_all_day = all_day.get();
                    view! {
                        <>
                            <div class=style::form_row>
                                <DateInput value=start_date label="Start Date".to_string() />
                                <TimeInput value=start_time label="Start Time".to_string() disabled=is_all_day />
                            </div>

                            <div class=style::form_row>
                                <DateInput value=end_date label="End Date".to_string() />
                                <TimeInput value=end_time label="End Time".to_string() disabled=is_all_day />
                            </div>
                        </>
                    }
                }}

                <div class=style::form_group>
                    <TimezoneSelect value=timezone label="Timezone".to_string() />
                </div>

                // Local time preview (shows converted time ONLY if timezone differs from user's local)
                {move || {
                    // Get user's local timezone from browser
                    let local_tz = get_browser_timezone();
                    let tz_id = timezone.get();

                    // Only show if timezone is different from local
                    if tz_id == local_tz {
                        return view! { <></> }.into_any();
                    }

                    // Get timezone offsets in minutes
                    let event_offset = timezone_offset_minutes(&tz_id);
                    let local_offset = timezone_offset_minutes(&local_tz);
                    let offset_diff = local_offset - event_offset; // Difference in minutes

                    // Parse the current time values
                    let s_time = start_time.get();
                    let e_time = end_time.get();

                    // Parse hours and minutes from HH:MM format
                    let parts: Vec<&str> = s_time.split(':').collect();
                    if parts.len() >= 2 {
                        let start_hour: i32 = parts[0].parse().unwrap_or(9);
                        let start_min: i32 = parts[1].parse().unwrap_or(0);

                        let e_parts: Vec<&str> = e_time.split(':').collect();
                        let end_hour: i32 = e_parts.get(0).unwrap_or(&"10").parse().unwrap_or(10);
                        let end_min: i32 = e_parts.get(1).unwrap_or(&"0").parse().unwrap_or(0);

                        // Convert to local time by applying offset difference
                        let convert_time = |hour: i32, min: i32| -> (i32, i32) {
                            let total_mins = hour * 60 + min + offset_diff;
                            let mut h = (total_mins / 60) % 24;
                            if h < 0 { h += 24; }
                            let m = total_mins.rem_euclid(60);
                            (h, m)
                        };

                        let (local_start_h, local_start_m) = convert_time(start_hour, start_min);
                        let (local_end_h, local_end_m) = convert_time(end_hour, end_min);

                        // Format for display
                        let format_time = |h: i32, m: i32| -> String {
                            let (h12, period) = if h == 0 { (12, "AM") }
                                else if h < 12 { (h, "AM") }
                                else if h == 12 { (12, "PM") }
                                else { (h - 12, "PM") };
                            format!("{}:{:02} {}", h12, m, period)
                        };

                        let start_display = format_time(local_start_h, local_start_m);
                        let end_display = format_time(local_end_h, local_end_m);
                        let local_tz_name = timezone_display_name(&local_tz);

                        view! {
                            <div class=style::local_time_preview>
                                <span class=style::preview_label>"Your local time: "</span>
                                <span class=style::preview_value>
                                    {format!("{} - {} ({})", start_display, end_display, local_tz_name)}
                                </span>
                            </div>
                        }.into_any()
                    } else {
                        view! { <></> }.into_any()
                    }
                }}

                <div class=style::form_row>
                    <div class=style::form_group>
                        <Select
                            value=event_type
                            options=event_type_options.get_value()
                            label="Event Type".to_string()
                        />
                    </div>
                    <div class=style::form_group>
                        <Select
                            value=recurrence
                            options=recurrence_options.get_value()
                            label="Recurrence".to_string()
                        />
                    </div>
                </div>

                // Recurrence options - only show when recurrence is not "none"
                {move || {
                    let rec = recurrence.get();
                    if rec == "none" {
                        view! { <></> }.into_any()
                    } else {
                        view! {
                            <div class=style::recurrence_options>
                                // Day selection for weekly recurrence
                                {if rec == "weekly" {
                                    let days = vec!["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                                    view! {
                                        <div class=style::form_group>
                                            <label class=style::form_label>"Repeat on"</label>
                                            <div class=style::day_checkboxes>
                                                {days.into_iter().map(|day| {
                                                    let day_str = day.to_string();
                                                    let day_for_check = day_str.clone();
                                                    let day_for_toggle = day_str.clone();
                                                    let is_selected = move || {
                                                        recurrence_days.get().contains(&day_for_check)
                                                    };
                                                    view! {
                                                        <button
                                                            type="button"
                                                            class=move || if is_selected() {
                                                                format!("{} {}", style::day_btn, style::day_btn_active)
                                                            } else {
                                                                style::day_btn.to_string()
                                                            }
                                                            on:click=move |_| {
                                                                recurrence_days.update(|days| {
                                                                    if days.contains(&day_for_toggle) {
                                                                        days.retain(|d| d != &day_for_toggle);
                                                                    } else {
                                                                        days.push(day_for_toggle.clone());
                                                                    }
                                                                });
                                                            }
                                                        >
                                                            {day}
                                                        </button>
                                                    }
                                                }).collect::<Vec<_>>()}
                                            </div>
                                        </div>
                                    }.into_any()
                                } else {
                                    view! { <></> }.into_any()
                                }}

                                // End date for all recurrence types
                                <div class=style::form_group>
                                    <DateInput value=recurrence_end_date label="Ends on (optional)".to_string() />
                                </div>
                            </div>
                        }.into_any()
                    }
                }}

                <div class=style::form_group>
                    <label class=style::form_label>"Location"</label>
                    <Input value=location placeholder="Room or virtual URL" />
                </div>

                <div class=style::form_group>
                    <PersonSearch
                        label="Organizers".to_string()
                        selected=organizer_ids
                        people=people_for_organizers.get_value()
                        placeholder="Search organizers..."
                    />
                </div>

                <div class=style::form_group>
                    <PersonSearch
                        label="Participants".to_string()
                        selected=participant_ids
                        people=people_for_participants.get_value()
                        placeholder="Search participants..."
                    />
                </div>

                <div class=style::form_actions>
                    <Button variant=ButtonVariant::Secondary on_click=handle_cancel>
                        "Cancel"
                    </Button>
                    <Button variant=ButtonVariant::Primary on_click=handle_save>
                        {if is_edit { "Save Changes" } else { "Create Event" }}
                    </Button>
                </div>
            </div>
        </Modal>
    }
}

// Helper functions
fn event_type_to_string(et: EventType) -> String {
    match et {
        EventType::Meeting => "meeting",
        EventType::Standup => "standup",
        EventType::AllHands => "all-hands",
        EventType::OneOnOne => "1:1",
        EventType::Training => "training",
        EventType::Interview => "interview",
        EventType::Holiday => "holiday",
        EventType::Conference => "conference",
        EventType::Review => "review",
        EventType::Planning => "planning",
        EventType::Appointment => "meeting",
        EventType::Reminder => "meeting",
        EventType::OutOfOffice => "holiday",
    }
    .to_string()
}

fn string_to_event_type(s: &str) -> EventType {
    match s {
        "standup" => EventType::Standup,
        "all-hands" => EventType::AllHands,
        "1:1" => EventType::OneOnOne,
        "training" => EventType::Training,
        "interview" => EventType::Interview,
        "holiday" => EventType::Holiday,
        "conference" => EventType::Conference,
        "review" => EventType::Review,
        "planning" => EventType::Planning,
        _ => EventType::Meeting,
    }
}

fn recurrence_to_string(r: RecurrenceFrequency) -> String {
    match r {
        RecurrenceFrequency::None => "none",
        RecurrenceFrequency::Daily => "daily",
        RecurrenceFrequency::Weekly => "weekly",
        RecurrenceFrequency::Monthly => "monthly",
        RecurrenceFrequency::Yearly => "yearly",
    }
    .to_string()
}

fn string_to_recurrence(s: &str) -> RecurrenceFrequency {
    match s {
        "daily" => RecurrenceFrequency::Daily,
        "weekly" => RecurrenceFrequency::Weekly,
        "monthly" => RecurrenceFrequency::Monthly,
        "yearly" => RecurrenceFrequency::Yearly,
        _ => RecurrenceFrequency::None,
    }
}

fn parse_datetime(date_str: &str, time_str: &str) -> Option<chrono::DateTime<Utc>> {
    let date = NaiveDate::parse_from_str(date_str, "%Y-%m-%d").ok()?;
    let time = NaiveTime::parse_from_str(time_str, "%H:%M").ok()?;
    let dt = date.and_time(time);
    Some(Utc.from_utc_datetime(&dt))
}
