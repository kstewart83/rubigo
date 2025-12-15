//! Calendar Module
//!
//! Handles event scheduling, recurrence, and views (Month/Week/Day).

use chrono::{DateTime, Datelike, Duration, TimeZone, Utc};
use leptos::prelude::*;
use nexosim_hybrid::database::calendar::{Meeting, MeetingType};
use nexosim_hybrid::database::geo::{Building, Floor, Person, Space};
use uuid::Uuid;

// -----------------------------------------------------------------------------
// Data Models
// -----------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq, Eq, Default)]
#[allow(dead_code)]
pub enum EventType {
    #[default]
    Meeting,
    Appointment,
    Reminder,
    OutOfOffice,
}

impl EventType {
    pub fn color(&self) -> &'static str {
        match self {
            EventType::Meeting => "#3b82f6",     // Blue
            EventType::Appointment => "#10b981", // Emerald
            EventType::Reminder => "#f59e0b",    // Amber
            EventType::OutOfOffice => "#ef4444", // Red
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
#[allow(dead_code)]
pub struct CalendarEvent {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub location: Option<String>,
    pub participants: Vec<Uuid>, // Personnel IDs
    pub event_type: EventType,

    // Recurrence
    pub recurrence_rule: Option<String>,
    pub parent_event_id: Option<Uuid>,
    pub recurrence_id: Option<DateTime<Utc>>,
}

#[allow(dead_code)]
impl CalendarEvent {
    pub fn new(title: String, start: DateTime<Utc>, end: DateTime<Utc>) -> Self {
        Self {
            id: Uuid::new_v4(),
            title,
            description: None,
            start_time: start,
            end_time: end,
            location: None,
            participants: vec![],
            event_type: EventType::Meeting,
            recurrence_rule: None,
            parent_event_id: None,
            recurrence_id: None,
        }
    }
}

// -----------------------------------------------------------------------------
// Components
// -----------------------------------------------------------------------------

#[component]
pub fn CalendarModule(
    month: Option<u32>,
    year: Option<i32>,
    modal: Option<String>,
    #[prop(default = None)] view: Option<String>,
    #[prop(default = None)] workweek: Option<String>,
    #[prop(default = vec![])] buildings: Vec<Building>,
    #[prop(default = vec![])] floors: Vec<Floor>,
    #[prop(default = vec![])] spaces: Vec<Space>,
    #[prop(default = vec![])] people: Vec<Person>,
    #[prop(default = vec![])] meetings: Vec<Meeting>,
) -> impl IntoView {
    // Determine current date
    let now = Utc::now();
    let current_year = year.unwrap_or(now.year());
    let current_month = month.unwrap_or(now.month());

    // Construct date (1st of month)
    let current_date = Utc
        .with_ymd_and_hms(current_year, current_month, 1, 0, 0, 0)
        .single()
        .unwrap_or(now);

    // Events will come from seed data (meetings.toml) - no need for dummy data
    let events: Vec<CalendarEvent> = vec![];

    // Determine current view (default to month)
    let current_view = view.as_deref().unwrap_or("month");

    // Determine if work week mode is on (hide Sat/Sun)
    let work_week_mode = workweek.as_deref() == Some("on");

    view! {
        <div class="calendar-container">
            <CalendarHeader current_date=current_date view=current_view.to_string() work_week=work_week_mode />
            <div class="calendar-main">
                {match current_view {
                    "week" => view! {
                        <WeekView current_date=current_date events=events.clone() meetings=meetings.clone() work_week=work_week_mode />
                    }.into_any(),
                    _ => view! {
                        <MonthView current_date=current_date events=events.clone() meetings=meetings.clone() work_week=work_week_mode />
                    }.into_any(),
                }}
            </div>


            // Modal Overlay
            {move || if modal.as_deref() == Some("new") {
                view! { <EventModal
                    current_date=current_date
                    buildings=buildings.clone()
                    floors=floors.clone()
                    spaces=spaces.clone()
                    people=people.clone()
                /> }.into_any()
            } else {
                view! { <span /> }.into_any()
            }}

            // Event Details Panel (slide-out from right)
            <div class="panel-overlay" id="event-panel-overlay" onclick="closeEventDetails()"></div>
            <aside class="details-panel event-details-panel" id="event-details-panel">
                <div class="panel-header">
                    <button class="panel-close" onclick="closeEventDetails()">"×"</button>
                    <div class="event-type-badge" id="event-type-badge"></div>
                    <h2 class="panel-name" id="event-title"></h2>
                </div>
                <div class="panel-content">
                    <div class="detail-row">
                        <span class="detail-label">"Date"</span>
                        <span class="detail-value" id="event-date"></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">"Time"</span>
                        <span class="detail-value" id="event-time"></span>
                    </div>
                    <div class="detail-row" id="event-recurrence-row" style="display:none">
                        <span class="detail-label">"Recurrence"</span>
                        <span class="detail-value" id="event-recurrence"></span>
                    </div>
                    <div class="detail-row" id="event-location-row" style="display:none">
                        <span class="detail-label">"Location"</span>
                        <span class="detail-value" id="event-location"></span>
                    </div>
                    <div class="panel-bio" id="event-description-section" style="display:none">
                        <h3 class="bio-label">"Description"</h3>
                        <p class="bio-text" id="event-description"></p>
                    </div>
                </div>
                <div class="panel-actions">
                    <button class="btn-primary" id="event-edit-btn">"Edit Event"</button>
                </div>
            </aside>

            // Serialize meetings data for JavaScript
            <script>
                {format!("window.MEETINGS_DATA = {};", serde_json::to_string(&meetings).unwrap_or_else(|_| "[]".to_string()))}
            </script>

            <script>{r#"
                // Event Details Panel Logic
                function openEventDetails(meetingId) {
                    const meetings = window.MEETINGS_DATA || [];
                    const meeting = meetings.find(m => {
                        const id = m.id ? (m.id.id ? m.id.id.String : m.id.toString()) : '';
                        return id === meetingId;
                    });
                    
                    if (!meeting) return;
                    
                    // Populate panel
                    document.getElementById('event-title').textContent = meeting.title;
                    
                    // Type badge
                    const typeBadge = document.getElementById('event-type-badge');
                    const typeColors = {
                        'Standup': '#10b981',
                        'AllHands': '#8b5cf6',
                        'OneOnOne': '#3b82f6',
                        'Training': '#f59e0b',
                        'Interview': '#6366f1',
                        'Holiday': '#ef4444',
                        'Conference': '#ec4899',
                        'Review': '#14b8a6',
                        'Planning': '#f97316',
                        'Meeting': '#6b7280'
                    };
                    const meetingType = meeting.meeting_type || 'Meeting';
                    typeBadge.textContent = meetingType.replace(/([A-Z])/g, ' $1').trim();
                    typeBadge.style.backgroundColor = typeColors[meetingType] || '#6b7280';
                    
                    // Date
                    const startDate = meeting.start_time.split('T')[0];
                    document.getElementById('event-date').textContent = new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    });
                    
                    // Time
                    const startTime = meeting.start_time.split('T')[1] || '00:00:00';
                    const endTime = meeting.end_time.split('T')[1] || '00:00:00';
                    const formatTime = (t) => {
                        const [h, m] = t.split(':');
                        const hour = parseInt(h);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const hour12 = hour % 12 || 12;
                        return `${hour12}:${m} ${ampm}`;
                    };
                    document.getElementById('event-time').textContent = `${formatTime(startTime)} - ${formatTime(endTime)}`;
                    
                    // Recurrence
                    const recurrenceRow = document.getElementById('event-recurrence-row');
                    if (meeting.recurrence && meeting.recurrence !== 'None') {
                        recurrenceRow.style.display = '';
                        let recText = meeting.recurrence;
                        if (meeting.recurrence_days && meeting.recurrence_days.length > 0) {
                            recText += ` (${meeting.recurrence_days.join(', ')})`;
                        }
                        document.getElementById('event-recurrence').textContent = recText;
                    } else {
                        recurrenceRow.style.display = 'none';
                    }
                    
                    // Description
                    const descSection = document.getElementById('event-description-section');
                    if (meeting.description) {
                        descSection.style.display = '';
                        document.getElementById('event-description').textContent = meeting.description;
                    } else {
                        descSection.style.display = 'none';
                    }
                    
                    // Store meeting ID for edit
                    document.getElementById('event-edit-btn').dataset.meetingId = meetingId;
                    
                    // Show panel
                    document.getElementById('event-panel-overlay').classList.add('open');
                    document.getElementById('event-details-panel').classList.add('open');
                }
                
                function closeEventDetails() {
                    document.getElementById('event-panel-overlay').classList.remove('open');
                    document.getElementById('event-details-panel').classList.remove('open');
                }
                
                // Edit button click
                document.addEventListener('DOMContentLoaded', function() {
                    const editBtn = document.getElementById('event-edit-btn');
                    if (editBtn) {
                        editBtn.addEventListener('click', function() {
                            const meetingId = this.dataset.meetingId;
                            // Close panel first
                            closeEventDetails();
                            // Navigate to edit modal (future implementation)
                            // For now, just open new event modal
                            window.location.href = '/?tab=calendar&modal=new';
                        });
                    }
                });
            "#}</script>

        </div>
    }
}

#[component]
fn CalendarHeader(current_date: DateTime<Utc>, view: String, work_week: bool) -> impl IntoView {
    let date_str = current_date.format("%B %Y").to_string();

    // Work week parameter for URLs
    let ww_param = if work_week { "&workweek=on" } else { "" };

    // Navigation Logic
    // Create URLs for Prev/Next
    // Simply subtract/add month
    let prev_month_date = if current_date.month() == 1 {
        Utc.with_ymd_and_hms(current_date.year() - 1, 12, 1, 0, 0, 0)
            .single()
            .unwrap()
    } else {
        Utc.with_ymd_and_hms(current_date.year(), current_date.month() - 1, 1, 0, 0, 0)
            .single()
            .unwrap()
    };
    let next_month_date = if current_date.month() == 12 {
        Utc.with_ymd_and_hms(current_date.year() + 1, 1, 1, 0, 0, 0)
            .single()
            .unwrap()
    } else {
        Utc.with_ymd_and_hms(current_date.year(), current_date.month() + 1, 1, 0, 0, 0)
            .single()
            .unwrap()
    };

    let prev_url = format!(
        "/?tab=calendar&year={}&month={}&view={}{}",
        prev_month_date.year(),
        prev_month_date.month(),
        view,
        ww_param
    );
    let next_url = format!(
        "/?tab=calendar&year={}&month={}&view={}{}",
        next_month_date.year(),
        next_month_date.month(),
        view,
        ww_param
    );
    let today_url = format!("/?tab=calendar&view={}{}", view, ww_param);

    // View URLs (preserve work week state)
    let month_url = format!(
        "/?tab=calendar&year={}&month={}&view=month{}",
        current_date.year(),
        current_date.month(),
        ww_param
    );
    let week_url = format!(
        "/?tab=calendar&year={}&month={}&view=week{}",
        current_date.year(),
        current_date.month(),
        ww_param
    );

    // Work week toggle URL (toggle the state)
    let work_week_toggle_url = format!(
        "/?tab=calendar&year={}&month={}&view={}{}",
        current_date.year(),
        current_date.month(),
        view,
        if work_week { "" } else { "&workweek=on" }
    );

    let month_class = if view == "month" {
        "view-btn active"
    } else {
        "view-btn"
    };
    let week_class = if view == "week" {
        "view-btn active"
    } else {
        "view-btn"
    };

    view! {
        <div class="calendar-header">
            <div class="calendar-title-group">
                <h2 class="calendar-title">{date_str}</h2>
                <div class="calendar-nav-group">
                    <a href=prev_url class="calendar-nav-btn">"←"</a>
                    <a href=today_url class="calendar-nav-btn">"Today"</a>
                    <a href=next_url class="calendar-nav-btn">"→"</a>
                </div>
            </div>

            <div class="calendar-controls">
                <label class="work-week-toggle">
                    <a href=work_week_toggle_url class="work-week-link">
                        <input type="checkbox" checked=work_week disabled />
                        <span>"Work Week"</span>
                    </a>
                </label>

                <div class="view-switcher">
                    <a href=month_url class=month_class>"Month"</a>
                    <a href=week_url class=week_class>"Week"</a>
                    <button class="view-btn" disabled>"Day"</button>
                </div>

                <a href="/?tab=calendar&modal=new" class="btn-primary">
                    <span>"+"</span>
                    <span>"New Event"</span>
                </a>
            </div>
        </div>
    }
}

#[component]
fn MonthView(
    current_date: DateTime<Utc>,
    events: Vec<CalendarEvent>,
    meetings: Vec<Meeting>,
    #[prop(default = false)] work_week: bool,
) -> impl IntoView {
    // Generate grid
    let days = {
        // Naive First Day of Month logic
        let first_day = current_date.with_day(1).unwrap();
        // We typically want to start on Sunday (or Monday for work week)
        let days_from_sun = first_day.weekday().num_days_from_sunday();
        let start_grid = first_day - Duration::days(days_from_sun as i64);

        // 6 rows * 7 cols = 42 cells
        let all_days: Vec<DateTime<Utc>> =
            (0..42).map(|i| start_grid + Duration::days(i)).collect();

        // Filter out weekends if work_week is enabled
        if work_week {
            all_days
                .into_iter()
                .filter(|d| {
                    let wd = d.weekday().num_days_from_sunday();
                    wd >= 1 && wd <= 5 // Mon-Fri
                })
                .collect()
        } else {
            all_days
        }
    };

    // Day headers based on work_week mode
    let day_headers: Vec<&str> = if work_week {
        vec!["Mon", "Tue", "Wed", "Thu", "Fri"]
    } else {
        vec!["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    };

    // Grid class based on work_week
    let grid_class = if work_week {
        "calendar-grid work-week"
    } else {
        "calendar-grid"
    };

    // Helper to get meeting color by type
    fn meeting_color(
        meeting_type: &nexosim_hybrid::database::calendar::MeetingType,
    ) -> &'static str {
        use nexosim_hybrid::database::calendar::MeetingType;
        match meeting_type {
            MeetingType::Standup => "#10b981",    // Green
            MeetingType::AllHands => "#8b5cf6",   // Purple
            MeetingType::OneOnOne => "#3b82f6",   // Blue
            MeetingType::Training => "#f59e0b",   // Amber
            MeetingType::Interview => "#6366f1",  // Indigo
            MeetingType::Holiday => "#ef4444",    // Red
            MeetingType::Conference => "#ec4899", // Pink
            MeetingType::Review => "#14b8a6",     // Teal
            MeetingType::Planning => "#f97316",   // Orange
            MeetingType::Meeting => "#6b7280",    // Gray
        }
    }

    view! {
        <div class=grid_class>
            // Header Row
            {day_headers.iter().map(|d| {
                view! { <div class="calendar-day-header">{*d}</div> }
            }).collect::<Vec<_>>()}


            // Days Grid
            <div class="calendar-days-grid">
                {days.into_iter().map(|date| {
                    let is_current_month = date.month() == current_date.month();
                    let is_today = date.date_naive() == Utc::now().date_naive();

                    let cell_class = if !is_current_month {
                        "calendar-day-cell outside-month"
                    } else if is_today {
                        "calendar-day-cell today"
                    } else {
                        "calendar-day-cell"
                    };

                    // Filter calendar events for this day
                    let day_events: Vec<&CalendarEvent> = events.iter().filter(|e| {
                         e.start_time.date_naive() == date.date_naive()
                    }).collect();

                    // Filter and expand meetings for this day
                    let date_str = date.format("%Y-%m-%d").to_string();
                    let weekday = date.weekday();
                    let weekday_abbr = match weekday {
                        chrono::Weekday::Mon => "Mon",
                        chrono::Weekday::Tue => "Tue",
                        chrono::Weekday::Wed => "Wed",
                        chrono::Weekday::Thu => "Thu",
                        chrono::Weekday::Fri => "Fri",
                        chrono::Weekday::Sat => "Sat",
                        chrono::Weekday::Sun => "Sun",
                    };

                    let day_meetings: Vec<&Meeting> = meetings.iter().filter(|m| {
                        // Parse meeting start date
                        let mtg_start_date = &m.start_time[..10]; // "YYYY-MM-DD"

                        // Check if this is the exact start date
                        if m.start_time.starts_with(&date_str) {
                            return true;
                        }

                        // Check for recurring meetings
                        use nexosim_hybrid::database::calendar::RecurrenceFrequency;
                        match m.recurrence {
                            RecurrenceFrequency::None => false,
                            RecurrenceFrequency::Daily => {
                                // Daily: show on all days after start
                                date_str >= mtg_start_date.to_string() &&
                                m.recurrence_until.as_ref().map(|u| date_str <= u[..10].to_string()).unwrap_or(true)
                            }
                            RecurrenceFrequency::Weekly => {
                                // Weekly: check if day of week matches recurrence_days
                                if date_str < mtg_start_date.to_string() {
                                    return false;
                                }
                                // Check end date
                                if let Some(until) = &m.recurrence_until {
                                    if date_str > until[..10].to_string() {
                                        return false;
                                    }
                                }
                                // Check if this day is in recurrence_days
                                if m.recurrence_days.is_empty() {
                                    // No specific days = same day of week as start
                                    weekday == chrono::NaiveDate::parse_from_str(mtg_start_date, "%Y-%m-%d")
                                        .map(|d| d.weekday())
                                        .unwrap_or(weekday)
                                } else {
                                    m.recurrence_days.iter().any(|d| d == weekday_abbr)
                                }
                            }
                            RecurrenceFrequency::Monthly => {
                                // Monthly: same day of month
                                if date_str < mtg_start_date.to_string() {
                                    return false;
                                }
                                let start_day = mtg_start_date[8..10].parse::<u32>().unwrap_or(1);
                                date.day() == start_day
                            }
                            RecurrenceFrequency::Yearly => {
                                // Yearly: same month and day
                                if date_str < mtg_start_date.to_string() {
                                    return false;
                                }
                                let start_month_day = &mtg_start_date[5..10]; // "MM-DD"
                                date.format("%m-%d").to_string() == start_month_day
                            }
                        }
                    }).collect();


                    view! {
                        <div class=cell_class>
                            <div class="day-number">
                                <span>{date.day()}</span>
                            </div>
                            <div class="day-events">
                                // Display meetings from seed data
                                {day_meetings.into_iter().map(|mtg| {
                                    let color = meeting_color(&mtg.meeting_type);
                                    let title = mtg.title.clone();
                                    // Extract meeting ID for click handler
                                    let meeting_id = mtg.id.as_ref()
                                        .map(|t| t.id.to_string())
                                        .unwrap_or_default();
                                    let onclick_handler = format!("openEventDetails('{}')", meeting_id);
                                    view! {
                                        <div class="event-pill meeting-pill"
                                             style=format!("background-color: {}; cursor: pointer;", color)
                                             onclick=onclick_handler>
                                            {title}
                                        </div>
                                    }
                                }).collect::<Vec<_>>()}

                                // Display CalendarEvents
                                {day_events.into_iter().map(|ev| {
                                    view! {
                                        <div class="event-pill"
                                             style=format!("background-color: {}", ev.event_type.color())>
                                            {ev.title.clone()}
                                        </div>
                                    }
                                }).collect::<Vec<_>>()}
                            </div>
                        </div>
                    }
                }).collect::<Vec<_>>()}
            </div>
        </div>
    }
}

#[allow(unused_variables)]
#[component]
fn WeekView(
    current_date: DateTime<Utc>,
    events: Vec<CalendarEvent>,
    meetings: Vec<Meeting>,
    #[prop(default = false)] work_week: bool,
) -> impl IntoView {
    // Calculate the week dates (Sunday to Saturday containing current_date)
    let now = Utc::now();
    let weekday = current_date.weekday().num_days_from_sunday();
    let week_start = current_date - Duration::days(weekday as i64);

    // Generate week days, filtering for work_week mode
    let week_days: Vec<DateTime<Utc>> = if work_week {
        // Mon-Fri only (indices 1-5)
        (1..6).map(|i| week_start + Duration::days(i)).collect()
    } else {
        // Sun-Sat (indices 0-6)
        (0..7).map(|i| week_start + Duration::days(i)).collect()
    };

    // Hours to display (6 AM to 10 PM)
    let hours: Vec<u32> = (6..22).collect();
    let start_hour = 6u32;
    let pixels_per_hour = 60u32;

    // Helper to get color for meeting type
    fn meeting_color(meeting_type: &MeetingType) -> &'static str {
        match meeting_type {
            MeetingType::Standup => "#10b981",
            MeetingType::AllHands => "#8b5cf6",
            MeetingType::OneOnOne => "#3b82f6",
            MeetingType::Training => "#f59e0b",
            MeetingType::Interview => "#6366f1",
            MeetingType::Holiday => "#ef4444",
            MeetingType::Conference => "#ec4899",
            MeetingType::Review => "#14b8a6",
            MeetingType::Planning => "#f97316",
            MeetingType::Meeting => "#6b7280",
        }
    }

    // Helper to parse time from datetime string
    fn parse_time(datetime: &str) -> (u32, u32) {
        if let Some(time_part) = datetime.split('T').nth(1) {
            let parts: Vec<&str> = time_part.split(':').collect();
            let hour = parts.get(0).and_then(|h| h.parse().ok()).unwrap_or(9);
            let min = parts.get(1).and_then(|m| m.parse().ok()).unwrap_or(0);
            (hour, min)
        } else {
            (9, 0)
        }
    }

    // Helper to format time for display
    fn format_time_display(hour: u32, min: u32) -> String {
        let period = if hour >= 12 { "PM" } else { "AM" };
        let hour12 = if hour == 0 {
            12
        } else if hour > 12 {
            hour - 12
        } else {
            hour
        };
        if min == 0 {
            format!("{}{}", hour12, period)
        } else {
            format!("{}:{:02}{}", hour12, min, period)
        }
    }

    let view_class = if work_week {
        "week-view work-week"
    } else {
        "week-view"
    };

    view! {
        <div class=view_class>

            // Week header with day names and dates
            <div class="week-header">
                <div class="week-time-gutter"></div>
                {week_days.iter().map(|day| {
                    let day_name = day.format("%a").to_string();
                    let day_num = day.day();
                    let is_today = day.date_naive() == now.date_naive();
                    let class = if is_today { "week-day-header today" } else { "week-day-header" };
                    view! {
                        <div class=class>
                            <span class="week-day-name">{day_name}</span>
                            <span class="week-day-num">{day_num}</span>
                        </div>
                    }
                }).collect::<Vec<_>>()}
            </div>

            // Week body - time column + 7 day columns
            <div class="week-body">
                // Time column
                <div class="week-time-column">
                    {hours.iter().map(|hour| {
                        let hour_label = if *hour < 12 {
                            format!("{} AM", hour)
                        } else if *hour == 12 {
                            "12 PM".to_string()
                        } else {
                            format!("{} PM", hour - 12)
                        };
                        view! {
                            <div class="week-time-slot">
                                <span>{hour_label}</span>
                            </div>
                        }
                    }).collect::<Vec<_>>()}
                </div>

                // Day columns with events
                {week_days.iter().map(|day| {
                    let date_str = day.format("%Y-%m-%d").to_string();
                    let is_today = day.date_naive() == now.date_naive();
                    let column_class = if is_today { "week-day-column today" } else { "week-day-column" };

                    // Get weekday for recurrence
                    let weekday = day.weekday();
                    let weekday_abbr = match weekday {
                        chrono::Weekday::Mon => "Mon",
                        chrono::Weekday::Tue => "Tue",
                        chrono::Weekday::Wed => "Wed",
                        chrono::Weekday::Thu => "Thu",
                        chrono::Weekday::Fri => "Fri",
                        chrono::Weekday::Sat => "Sat",
                        chrono::Weekday::Sun => "Sun",
                    };

                    // Find all meetings for this day (with recurrence expansion)
                    use nexosim_hybrid::database::calendar::RecurrenceFrequency;
                    let day_meetings: Vec<&Meeting> = meetings.iter().filter(|m| {
                        let mtg_start_date = &m.start_time[..10];

                        // Check if this is the exact start date
                        if m.start_time.starts_with(&date_str) {
                            return true;
                        }

                        // Check for recurring meetings
                        match m.recurrence {
                            RecurrenceFrequency::None => false,
                            RecurrenceFrequency::Daily => {
                                date_str >= mtg_start_date.to_string() &&
                                m.recurrence_until.as_ref().map(|u| date_str <= u[..10].to_string()).unwrap_or(true)
                            }
                            RecurrenceFrequency::Weekly => {
                                if date_str < mtg_start_date.to_string() {
                                    return false;
                                }
                                if let Some(until) = &m.recurrence_until {
                                    if date_str > until[..10].to_string() {
                                        return false;
                                    }
                                }
                                if m.recurrence_days.is_empty() {
                                    let orig_weekday = chrono::NaiveDate::parse_from_str(mtg_start_date, "%Y-%m-%d")
                                        .map(|d| d.weekday())
                                        .ok();
                                    orig_weekday == Some(weekday)
                                } else {
                                    m.recurrence_days.iter().any(|d| d == weekday_abbr)
                                }
                            }
                            RecurrenceFrequency::Monthly => {
                                if date_str < mtg_start_date.to_string() {
                                    return false;
                                }
                                let start_day = mtg_start_date[8..10].parse::<u32>().unwrap_or(1);
                                day.day() == start_day
                            }
                            RecurrenceFrequency::Yearly => {
                                if date_str < mtg_start_date.to_string() {
                                    return false;
                                }
                                let start_month_day = &mtg_start_date[5..10];
                                day.format("%m-%d").to_string() == start_month_day
                            }
                        }
                    }).collect();

                    view! {
                        <div class=column_class>
                            // Draw hour grid lines
                            {hours.iter().map(|_| {
                                view! { <div class="week-hour-line"></div> }
                            }).collect::<Vec<_>>()}

                            // Position events absolutely
                            {day_meetings.into_iter().map(|mtg| {
                                let color = meeting_color(&mtg.meeting_type);
                                let title = mtg.title.clone();
                                let meeting_id = mtg.id.as_ref()
                                    .map(|t| t.id.to_string())
                                    .unwrap_or_default();
                                let onclick_handler = format!("openEventDetails('{}')", meeting_id);

                                // Calculate position and height
                                let (start_h, start_m) = parse_time(&mtg.start_time);
                                let (end_h, end_m) = parse_time(&mtg.end_time);

                                // Clamp to visible range
                                let start_h = start_h.max(start_hour);
                                let end_h = end_h.min(22);

                                let top_px = ((start_h - start_hour) * pixels_per_hour) + (start_m * pixels_per_hour / 60);
                                let end_offset = ((end_h - start_hour) * pixels_per_hour) + (end_m * pixels_per_hour / 60);
                                let height_px = end_offset.saturating_sub(top_px).max(20);

                                let time_str = format!("{} - {}",
                                    format_time_display(start_h, start_m),
                                    format_time_display(end_h, end_m)
                                );

                                view! {
                                    <div class="week-event"
                                         style=format!("background-color: {}; top: {}px; height: {}px;", color, top_px, height_px)
                                         onclick=onclick_handler>
                                        <div class="week-event-title">{title}</div>
                                        <div class="week-event-time">{time_str}</div>
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

#[component]
fn EventModal(
    current_date: DateTime<Utc>,
    buildings: Vec<Building>,
    floors: Vec<Floor>,
    spaces: Vec<Space>,
    people: Vec<Person>,
) -> impl IntoView {
    let close_url = format!(
        "/?tab=calendar&year={}&month={}",
        current_date.year(),
        current_date.month()
    );
    let default_date = current_date.format("%Y-%m-%d").to_string();
    let default_start_time = "9:00 AM";
    let default_end_time = "10:00 AM";

    // Build JSON data structure for locations
    // Format: { buildings: [{id, name}], floors: [{id, name, building_id}], spaces: [{id, name, floor_id, locator}] }
    let buildings_json: Vec<serde_json::Value> = buildings
        .iter()
        .map(|b| {
            serde_json::json!({
                "id": b.id.as_ref().map(|t| t.to_string()).unwrap_or_default(),
                "name": b.name,
            })
        })
        .collect();

    let floors_json: Vec<serde_json::Value> = floors
        .iter()
        .map(|f| {
            serde_json::json!({
                "id": f.id.as_ref().map(|t| t.to_string()).unwrap_or_default(),
                "name": f.name,
                "building_id": f.building_id.to_string(),
            })
        })
        .collect();

    let spaces_json: Vec<serde_json::Value> = spaces
        .iter()
        .map(|s| {
            serde_json::json!({
                "id": s.id.as_ref().map(|t| t.to_string()).unwrap_or_default(),
                "name": s.name,
                "floor_id": s.floor_id.to_string(),
                "locator": s.locator,
            })
        })
        .collect();

    let location_data = serde_json::json!({
        "buildings": buildings_json,
        "floors": floors_json,
        "spaces": spaces_json,
    });
    let location_data_str = location_data.to_string();

    // Build JSON data structure for people (participants)
    // Format: [{id, name, title, department, email}]
    let people_json: Vec<serde_json::Value> = people
        .iter()
        .map(|p| {
            serde_json::json!({
                "id": p.id.as_ref().map(|t| t.to_string()).unwrap_or_default(),
                "name": p.name,
                "title": p.title,
                "department": p.department,
                "email": p.email,
            })
        })
        .collect();
    let people_data_str = serde_json::to_string(&people_json).unwrap_or_default();

    view! {
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>"New Event"</h3>
                    <a href=close_url.clone() class="modal-close">"×"</a>
                </div>
                <div class="modal-body">
                    <form class="event-form" action="/events/create" method="post">
                        // Basic Info
                        <div class="form-row">
                            <div class="form-group flex-1">
                                <label>"Title"</label>
                                <input type="text" name="title" class="form-input" placeholder="Event Title" required />
                            </div>
                            <div class="form-group w-1/3">
                                <label>"Type"</label>
                                <select class="form-select" name="type">
                                    <option value="Meeting">"Meeting"</option>
                                    <option value="Appointment">"Appointment"</option>
                                    <option value="Reminder">"Reminder"</option>
                                    <option value="OutOfOffice">"Out of Office"</option>
                                </select>
                            </div>
                        </div>

                        // Date & Time Section
                        <div class="datetime-section">
                            <div class="datetime-row">
                                <div class="datetime-group">
                                    <label>"Start"</label>
                                    <div class="datetime-inputs">
                                        <div class="date-picker-wrapper" data-picker="start_date">
                                            <input type="text" name="start_date" class="form-input date-input"
                                                   value=default_date.clone() readonly placeholder="Select date..." />
                                            <button type="button" class="date-picker-trigger">"📅"</button>
                                            <div class="date-picker-popup" hidden></div>
                                        </div>
                                        <div class="time-picker-wrapper" data-picker="start_time">
                                            <input type="text" name="start_time" class="form-input time-input"
                                                   value=default_start_time readonly placeholder="Time" />
                                            <button type="button" class="time-picker-trigger">"🕐"</button>
                                            <div class="time-picker-popup" hidden></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="datetime-group">
                                    <label>"End"</label>
                                    <div class="datetime-inputs">
                                        <div class="date-picker-wrapper" data-picker="end_date">
                                            <input type="text" name="end_date" class="form-input date-input"
                                                   value=default_date.clone() readonly placeholder="Select date..." />
                                            <button type="button" class="date-picker-trigger">"📅"</button>
                                            <div class="date-picker-popup" hidden></div>
                                        </div>
                                        <div class="time-picker-wrapper" data-picker="end_time">
                                            <input type="text" name="end_time" class="form-input time-input"
                                                   value=default_end_time readonly placeholder="Time" />
                                            <button type="button" class="time-picker-trigger">"🕐"</button>
                                            <div class="time-picker-popup" hidden></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="timezone-row">
                                <label>"Timezone"</label>
                                <select class="form-select" name="timezone">
                                    <option value="UTC">"UTC"</option>
                                    <option value="America/New_York" selected>"New York (EST)"</option>
                                    <option value="America/Chicago">"Chicago (CST)"</option>
                                    <option value="America/Denver">"Denver (MST)"</option>
                                    <option value="America/Los_Angeles">"Los Angeles (PST)"</option>
                                    <option value="Europe/London">"London (GMT)"</option>
                                    <option value="Asia/Tokyo">"Tokyo (JST)"</option>
                                </select>
                            </div>
                        </div>



                        // Time Datalist
                        <datalist id="time-options">
                            <option value="08:00"></option>
                            <option value="08:30"></option>
                            <option value="09:00"></option>
                            <option value="09:30"></option>
                            <option value="10:00"></option>
                            <option value="10:30"></option>
                            <option value="11:00"></option>
                            <option value="11:30"></option>
                            <option value="12:00"></option>
                            <option value="12:30"></option>
                            <option value="13:00"></option>
                            <option value="13:30"></option>
                            <option value="14:00"></option>
                            <option value="14:30"></option>
                            <option value="15:00"></option>
                            <option value="15:30"></option>
                            <option value="16:00"></option>
                            <option value="16:30"></option>
                            <option value="17:00"></option>
                        </datalist>

                        // Locations Section (Dynamic)
                        <div class="form-group locations-section">
                            <label>"Locations"</label>
                            <div class="location-buttons">
                                <button type="button" id="add-physical-location-btn" class="btn-secondary btn-sm">
                                    "📍 Add Physical Location"
                                </button>
                                <button type="button" id="add-virtual-location-btn" class="btn-secondary btn-sm">
                                    "🔗 Add Virtual Location"
                                </button>
                            </div>
                            <div id="locations-container" class="locations-container">
                                // Dynamic rows injected here - starts empty
                            </div>
                            <input type="hidden" name="locations_data" id="locations-data" />
                        </div>
                        // Participants Section
                        <div class="form-group participants-section">
                            <label>"Participants"</label>
                            <div id="participant-chips" class="participant-chips"></div>
                            <div class="participant-search-wrapper">
                                <input type="text"
                                    id="participant-search"
                                    class="form-input participant-search-input"
                                    placeholder="Search by name, title, or department..."
                                    autocomplete="off" />
                                <div id="participant-dropdown" class="searchable-select-dropdown" hidden></div>
                            </div>
                            <input type="hidden" name="participants_data" id="participants-data" />
                        </div>


                        <div class="form-group">
                            <label>"Description"</label>
                            <textarea name="description" class="form-input" rows="3" placeholder="add details..."></textarea>
                        </div>

                        // Recurrence Section
                        <fieldset class="recurrence-section">
                            <legend class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">"Recurrence"</legend>
                            <div class="form-group">
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" id="recurrence-toggle" name="is_recurring" class="form-checkbox" />
                                    <span>"Repeat this event?"</span>
                                </label>
                            </div>

                            <div id="recurrence-options" class="hidden pl-4 border-l-2 border-gray-200 ml-1 mt-2">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>"Frequency"</label>
                                        <select name="freq" class="form-select">
                                            <option value="DAILY">"Daily"</option>
                                            <option value="WEEKLY" selected>"Weekly"</option>
                                            <option value="MONTHLY">"Monthly"</option>
                                            <option value="YEARLY">"Yearly"</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>"Every"</label>
                                        <div class="flex items-center gap-2">
                                            <input type="number" name="interval" class="form-input w-20" value="1" min="1" />
                                            <span class="text-sm text-gray-600">"week(s)"</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label>"By Day"</label>
                                    <div class="flex gap-2 flex-wrap">
                                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].into_iter().map(|day| {
                                            view! {
                                                <label class="day-toggle">
                                                    <input type="checkbox" name="byday" value=day />
                                                    <span>{day}</span>
                                                </label>
                                            }
                                        }).collect::<Vec<_>>()}
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label>"End"</label>
                                    <div class="end-condition-group">
                                        <label class="end-condition-option">
                                            <input type="radio" name="until_type" value="never" checked />
                                            <span>"Never"</span>
                                        </label>
                                        <label class="end-condition-option">
                                            <input type="radio" name="until_type" value="date" />
                                            <span>"On date"</span>
                                            <input type="date" name="until_date" class="form-input" disabled />
                                        </label>
                                        <label class="end-condition-option">
                                            <input type="radio" name="until_type" value="count" />
                                            <span>"After"</span>
                                            <input type="number" name="count" class="form-input" style="width: 80px;" value="10" disabled />
                                            <span>"occurrences"</span>
                                        </label>
                                    </div>
                                </div>

                            </div>
                        </fieldset>

                        <div class="form-actions border-t border-gray-200 pt-4 mt-4">
                            <a href=close_url class="btn-secondary">"Cancel"</a>
                            <button type="submit" class="btn-primary">"Save Event"</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        // LOCATION_DATA in separate script to avoid Leptos text node issues
        <script>
        {format!("const LOCATION_DATA = {};", location_data_str)}
        </script>
        // PEOPLE_DATA for searchable participants
        <script>
        {format!("const PEOPLE_DATA = {};", people_data_str)}
        </script>
        // Inline Script for Modal Logic

        <script>
        "
            document.addEventListener('DOMContentLoaded', function() {
                const toggle = document.getElementById('recurrence-toggle');


                const options = document.getElementById('recurrence-options');
                if (toggle && options) {
                    toggle.addEventListener('change', function(e) {
                        e.target.checked ? options.classList.remove('hidden') : options.classList.add('hidden');
                    });
                }

                // Locations Logic - Physical and Virtual with Searchable Dropdowns
                const addPhysicalBtn = document.getElementById('add-physical-location-btn');
                const addVirtualBtn = document.getElementById('add-virtual-location-btn');
                const locContainer = document.getElementById('locations-container');
                
                if (addPhysicalBtn && locContainer) {
                    addPhysicalBtn.addEventListener('click', function() {
                        addPhysicalLocationRow();
                    });
                }

                if (addVirtualBtn && locContainer) {
                    addVirtualBtn.addEventListener('click', function() {
                        addVirtualLocationRow();
                    });
                }

                // Searchable Combobox Component
                function createSearchableSelect(placeholder, items, onSelect, filterFn) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'searchable-select-wrapper';
                    
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'form-input searchable-select-input';
                    input.placeholder = placeholder;
                    input.autocomplete = 'off';
                    
                    const dropdown = document.createElement('div');
                    dropdown.className = 'searchable-select-dropdown';
                    dropdown.hidden = true;
                    
                    let selectedId = '';
                    let currentItems = items;
                    
                    function renderDropdown(filter = '') {
                        dropdown.innerHTML = '';
                        const filterLower = filter.toLowerCase();
                        const filtered = currentItems.filter(item => 
                            item.name.toLowerCase().includes(filterLower)
                        );
                        
                        if (filtered.length === 0) {
                            const noMatch = document.createElement('div');
                            noMatch.className = 'searchable-select-item no-match';
                            noMatch.textContent = 'No matches';
                            dropdown.appendChild(noMatch);
                        } else {
                            filtered.forEach(item => {
                                const opt = document.createElement('div');
                                opt.className = 'searchable-select-item';
                                opt.textContent = item.name;
                                opt.dataset.id = item.id;
                                if (item.id === selectedId) {
                                    opt.classList.add('selected');
                                }
                                opt.onclick = function(e) {
                                    e.stopPropagation();
                                    selectedId = item.id;
                                    input.value = item.name;
                                    input.dataset.selectedId = item.id;
                                    dropdown.hidden = true;
                                    if (onSelect) onSelect(item);
                                };
                                dropdown.appendChild(opt);
                            });
                        }
                    }
                    
                    input.addEventListener('focus', function() {
                        renderDropdown(this.value);
                        dropdown.hidden = false;
                    });
                    
                    input.addEventListener('input', function() {
                        renderDropdown(this.value);
                        dropdown.hidden = false;
                        // Clear selection if user types
                        if (selectedId && this.value !== currentItems.find(i => i.id === selectedId)?.name) {
                            selectedId = '';
                            delete this.dataset.selectedId;
                        }
                    });
                    
                    // Close on click outside
                    document.addEventListener('click', function(e) {
                        if (!wrapper.contains(e.target)) {
                            dropdown.hidden = true;
                        }
                    });
                    
                    // Update items (for cascading)
                    wrapper.updateItems = function(newItems) {
                        currentItems = newItems;
                        selectedId = '';
                        input.value = '';
                        delete input.dataset.selectedId;
                        renderDropdown();
                    };
                    
                    wrapper.setDisabled = function(disabled) {
                        input.disabled = disabled;
                        if (disabled) {
                            input.value = '';
                            selectedId = '';
                            delete input.dataset.selectedId;
                            wrapper.classList.add('disabled');
                        } else {
                            wrapper.classList.remove('disabled');
                        }
                    };
                    
                    wrapper.getSelectedId = function() {
                        return input.dataset.selectedId || '';
                    };
                    
                    wrapper.appendChild(input);
                    wrapper.appendChild(dropdown);
                    return wrapper;
                }

                function addPhysicalLocationRow() {
                    const row = document.createElement('div');
                    row.className = 'location-row location-row-physical';
                    
                    // Building Select (searchable)
                    let selectedBuildingId = '';
                    const buildingSelect = createSearchableSelect(
                        'Building...',
                        LOCATION_DATA.buildings,
                        function(building) {
                            selectedBuildingId = building.id;
                            // Filter floors for this building
                            const buildingFloors = LOCATION_DATA.floors.filter(f => f.building_id === building.id);
                            floorSelect.updateItems(buildingFloors);
                            floorSelect.setDisabled(false);
                            spaceSelect.updateItems([]);
                            spaceSelect.setDisabled(true);
                        }
                    );

                    // Floor Select (searchable, initially disabled)
                    let selectedFloorId = '';
                    const floorSelect = createSearchableSelect(
                        'Floor...',
                        [],
                        function(floor) {
                            selectedFloorId = floor.id;
                            // Filter spaces for this floor
                            const floorSpaces = LOCATION_DATA.spaces.filter(s => s.floor_id === floor.id);
                            spaceSelect.updateItems(floorSpaces);
                            spaceSelect.setDisabled(false);
                        }
                    );
                    floorSelect.setDisabled(true);

                    // Space Select (searchable, initially disabled)
                    const spaceSelect = createSearchableSelect(
                        'Space...',
                        [],
                        null
                    );
                    spaceSelect.setDisabled(true);

                    // Delete Button
                    const deleteBtn = document.createElement('button');
                    deleteBtn.type = 'button';
                    deleteBtn.className = 'location-delete-btn';
                    deleteBtn.textContent = '🗑';
                    deleteBtn.title = 'Remove location';
                    deleteBtn.onclick = function() { row.remove(); };

                    row.appendChild(buildingSelect);
                    row.appendChild(floorSelect);
                    row.appendChild(spaceSelect);
                    row.appendChild(deleteBtn);
                    locContainer.appendChild(row);
                }

                function addVirtualLocationRow() {
                    const row = document.createElement('div');
                    row.className = 'location-row location-row-virtual';
                    
                    // URL Input
                    const urlInput = document.createElement('input');
                    urlInput.type = 'url';
                    urlInput.className = 'form-input';
                    urlInput.placeholder = 'https://zoom.us/j/... or meeting link';

                    // Delete Button
                    const deleteBtn = document.createElement('button');
                    deleteBtn.type = 'button';
                    deleteBtn.className = 'location-delete-btn';
                    deleteBtn.textContent = '🗑';
                    deleteBtn.title = 'Remove location';
                    deleteBtn.onclick = function() { row.remove(); };

                    row.appendChild(urlInput);
                    row.appendChild(deleteBtn);
                    locContainer.appendChild(row);
                }

                // ==========================================
                // Participant Search / Multi-Select Logic
                // ==========================================
                const participantSearch = document.getElementById('participant-search');
                const participantDropdown = document.getElementById('participant-dropdown');
                const participantChips = document.getElementById('participant-chips');
                const participantsDataInput = document.getElementById('participants-data');
                
                let selectedParticipants = [];
                
                function renderParticipantDropdown(filter = '') {
                    participantDropdown.innerHTML = '';
                    const filterLower = filter.toLowerCase();
                    
                    const filtered = PEOPLE_DATA.filter(person => {
                        // Skip already selected
                        if (selectedParticipants.some(p => p.id === person.id)) return false;
                        // Match name, title, or department
                        return person.name.toLowerCase().includes(filterLower) ||
                               person.title.toLowerCase().includes(filterLower) ||
                               person.department.toLowerCase().includes(filterLower);
                    });
                    
                    if (filtered.length === 0) {
                        const noMatch = document.createElement('div');
                        noMatch.className = 'searchable-select-item no-match';
                        noMatch.textContent = filter ? 'No matches' : 'Start typing to search...';
                        participantDropdown.appendChild(noMatch);
                    } else {
                        filtered.slice(0, 10).forEach(person => {
                            const initials = person.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                            const item = document.createElement('div');
                            item.className = 'searchable-select-item participant-item';
                            item.innerHTML = `
                                <div class=\"participant-item-avatar\">${initials}</div>
                                <div class=\"participant-item-info\">
                                    <div class=\"participant-item-name\">${person.name}</div>
                                    <div class=\"participant-item-details\">${person.title} • ${person.department}</div>
                                </div>`;
                            item.onclick = function(e) {
                                e.stopPropagation();
                                addParticipant(person);
                                participantSearch.value = '';
                                participantDropdown.hidden = true;
                            };
                            participantDropdown.appendChild(item);
                        });
                    }
                }
                
                function addParticipant(person) {
                    selectedParticipants.push(person);
                    updateParticipantChips();
                    updateParticipantsData();
                }
                
                function removeParticipant(personId) {
                    selectedParticipants = selectedParticipants.filter(p => p.id !== personId);
                    updateParticipantChips();
                    updateParticipantsData();
                }
                
                function updateParticipantChips() {
                    participantChips.innerHTML = '';
                    selectedParticipants.forEach(person => {
                        const initials = person.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        const chip = document.createElement('div');
                        chip.className = 'participant-chip';
                        chip.innerHTML = `
                            <div class=\"participant-chip-avatar\">${initials}</div>
                            <div class=\"participant-chip-info\">
                                <span class=\"participant-chip-name\">${person.name}</span>
                                <span class=\"participant-chip-title\">${person.title}</span>
                            </div>
                            <button type=\"button\" class=\"chip-remove\" title=\"Remove\">×</button>`;
                        chip.querySelector('.chip-remove').onclick = function() {
                            removeParticipant(person.id);
                        };
                        participantChips.appendChild(chip);
                    });
                }

                
                function updateParticipantsData() {
                    participantsDataInput.value = JSON.stringify(selectedParticipants.map(p => p.id));
                }
                
                if (participantSearch && participantDropdown) {
                    participantSearch.addEventListener('focus', function() {
                        renderParticipantDropdown(this.value);
                        participantDropdown.hidden = false;
                    });
                    
                    participantSearch.addEventListener('input', function() {
                        renderParticipantDropdown(this.value);
                        participantDropdown.hidden = false;
                    });
                    
                    document.addEventListener('click', function(e) {
                        if (!participantSearch.parentElement.contains(e.target)) {
                            participantDropdown.hidden = true;
                        }
                    });
                }


                // ==========================================
                // Custom Date Picker Logic
                // ==========================================
                const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',

                                'July', 'August', 'September', 'October', 'November', 'December'];
                const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

                function initDatePickers() {
                    document.querySelectorAll('.date-picker-wrapper').forEach(wrapper => {
                        const input = wrapper.querySelector('.date-input');
                        const trigger = wrapper.querySelector('.date-picker-trigger');
                        const popup = wrapper.querySelector('.date-picker-popup');
                        
                        if (!input || !popup) return;

                        let currentDate = input.value ? parseDate(input.value) : new Date();
                        let selectedDate = input.value ? parseDate(input.value) : null;

                        // Build popup structure
                        popup.innerHTML = `
                            <div class='picker-header'>
                                <button type='button' class='picker-nav-btn prev'>←</button>
                                <span class='picker-month-year'></span>
                                <button type='button' class='picker-nav-btn next'>→</button>
                            </div>
                            <div class='picker-weekdays'>
                                ${WEEKDAYS.map(d => `<span>${d}</span>`).join('')}
                            </div>
                            <div class='picker-days'></div>
                            <div class='picker-footer'>
                                <button type='button' class='picker-today-btn'>Today</button>
                            </div>
                        `;

                        const monthYearSpan = popup.querySelector('.picker-month-year');
                        const daysContainer = popup.querySelector('.picker-days');
                        const prevBtn = popup.querySelector('.picker-nav-btn.prev');
                        const nextBtn = popup.querySelector('.picker-nav-btn.next');
                        const todayBtn = popup.querySelector('.picker-today-btn');

                        function parseDate(str) {
                            const [y, m, d] = str.split('-').map(Number);
                            return new Date(y, m - 1, d);
                        }

                        function formatDate(date) {
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, '0');
                            const d = String(date.getDate()).padStart(2, '0');
                            return `${y}-${m}-${d}`;
                        }

                        function renderCalendar() {
                            monthYearSpan.textContent = `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
                            daysContainer.innerHTML = '';

                            const year = currentDate.getFullYear();
                            const month = currentDate.getMonth();
                            const firstDay = new Date(year, month, 1);
                            const lastDay = new Date(year, month + 1, 0);
                            const startPad = firstDay.getDay();
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            // Previous month days
                            const prevMonthLast = new Date(year, month, 0);
                            for (let i = startPad - 1; i >= 0; i--) {
                                const day = prevMonthLast.getDate() - i;
                                const btn = document.createElement('button');
                                btn.type = 'button';
                                btn.className = 'picker-day other-month';
                                btn.textContent = day;
                                btn.onclick = () => selectDate(new Date(year, month - 1, day));
                                daysContainer.appendChild(btn);
                            }

                            // Current month days
                            for (let d = 1; d <= lastDay.getDate(); d++) {
                                const date = new Date(year, month, d);
                                const btn = document.createElement('button');
                                btn.type = 'button';
                                btn.className = 'picker-day';
                                btn.textContent = d;

                                if (date.getTime() === today.getTime()) {
                                    btn.classList.add('today');
                                }
                                if (selectedDate && date.getTime() === selectedDate.getTime()) {
                                    btn.classList.add('selected');
                                }

                                btn.onclick = () => selectDate(date);
                                daysContainer.appendChild(btn);
                            }

                            // Next month days (fill remaining)
                            const cellsUsed = startPad + lastDay.getDate();
                            const remaining = 42 - cellsUsed;
                            for (let d = 1; d <= remaining; d++) {
                                const btn = document.createElement('button');
                                btn.type = 'button';
                                btn.className = 'picker-day other-month';
                                btn.textContent = d;
                                btn.onclick = () => selectDate(new Date(year, month + 1, d));
                                daysContainer.appendChild(btn);
                            }
                        }

                        function selectDate(date) {
                            selectedDate = date;
                            input.value = formatDate(date);
                            hidePopup();
                        }

                        function showPopup() {
                            if (selectedDate) {
                                currentDate = new Date(selectedDate);
                            }
                            renderCalendar();
                            popup.hidden = false;
                        }

                        function hidePopup() {
                            popup.hidden = true;
                        }

                        // Event handlers
                        input.addEventListener('click', showPopup);
                        trigger.addEventListener('click', showPopup);

                        prevBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            currentDate.setMonth(currentDate.getMonth() - 1);
                            renderCalendar();
                        });

                        nextBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            currentDate.setMonth(currentDate.getMonth() + 1);
                            renderCalendar();
                        });

                        todayBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            selectDate(new Date());
                        });

                        // Close on click outside
                        document.addEventListener('click', (e) => {
                            if (!wrapper.contains(e.target)) {
                                hidePopup();
                            }
                        });

                        // Close on ESC
                        document.addEventListener('keydown', (e) => {
                            if (e.key === 'Escape') {
                                hidePopup();
                            }
                        });
                    });
                }

                initDatePickers();

                // ==========================================
                // Custom Time Picker Logic (12-hour AM/PM)
                // ==========================================
                function initTimePickers() {
                    document.querySelectorAll('.time-picker-wrapper').forEach(wrapper => {
                        const input = wrapper.querySelector('.time-input');
                        const trigger = wrapper.querySelector('.time-picker-trigger');
                        const popup = wrapper.querySelector('.time-picker-popup');
                        
                        if (!input || !popup) return;

                        let selectedHour = 9;  // 24-hour internal
                        let selectedMinute = 0;

                        // Parse initial value (12-hour H:MM AM/PM format)
                        if (input.value) {
                            const match = input.value.match(/^(\\d{1,2}):(\\d{2})\\s*(AM|PM)$/i);
                            if (match) {
                                let h = parseInt(match[1], 10);
                                const m = parseInt(match[2], 10);
                                const isPM = match[3].toUpperCase() === 'PM';
                                // Convert to 24-hour
                                if (h === 12) {
                                    selectedHour = isPM ? 12 : 0;
                                } else {
                                    selectedHour = isPM ? h + 12 : h;
                                }
                                selectedMinute = m;
                            }
                        }


                        // Build popup structure with AM/PM column
                        popup.innerHTML = `
                            <div class='time-grid'>
                                <div class='time-column'>
                                    <div class='time-column-label'>Hour</div>
                                    <div class='time-scroll' data-col='hour'></div>
                                </div>
                                <div class='time-column'>
                                    <div class='time-column-label'>Min</div>
                                    <div class='time-scroll' data-col='min'></div>
                                </div>
                                <div class='time-column time-column-ampm'>
                                    <div class='time-column-label'>&nbsp;</div>
                                    <div class='time-ampm-container'></div>
                                </div>
                            </div>
                            <div class='time-footer'>
                                <button type='button' class='time-now-btn'>Now</button>
                            </div>
                        `;

                        const hourScroll = popup.querySelector('[data-col=\"hour\"]');
                        const minScroll = popup.querySelector('[data-col=\"min\"]');
                        const ampmContainer = popup.querySelector('.time-ampm-container');
                        const nowBtn = popup.querySelector('.time-now-btn');

                        // Convert 24h to 12h format for display
                        function to12Hour(h24) {
                            const isPM = h24 >= 12;
                            let h12 = h24 % 12;
                            if (h12 === 0) h12 = 12;
                            return { hour: h12, isPM };
                        }

                        // Convert 12h to 24h for storage
                        function to24Hour(h12, isPM) {
                            if (h12 === 12) {
                                return isPM ? 12 : 0;
                            }
                            return isPM ? h12 + 12 : h12;
                        }

                        function formatDisplayTime(h24, m) {
                            const { hour, isPM } = to12Hour(h24);
                            const period = isPM ? 'PM' : 'AM';
                            return `${hour}:${String(m).padStart(2, '0')} ${period}`;
                        }

                        function formatStorageTime(h24, m) {
                            return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                        }

                        function renderTime() {
                            const { hour: displayHour, isPM } = to12Hour(selectedHour);

                            // Hours (1-12)
                            hourScroll.innerHTML = '';
                            for (let h = 1; h <= 12; h++) {
                                const btn = document.createElement('button');
                                btn.type = 'button';
                                btn.className = 'time-option';
                                btn.textContent = h;
                                if (h === displayHour) btn.classList.add('selected');
                                btn.onclick = (e) => {
                                    e.stopPropagation();
                                    selectedHour = to24Hour(h, isPM);
                                    renderTime();
                                    updateInput();
                                };
                                hourScroll.appendChild(btn);
                            }

                            // Minutes (0, 5, 10, ..., 55)
                            minScroll.innerHTML = '';
                            for (let m = 0; m < 60; m += 5) {
                                const btn = document.createElement('button');
                                btn.type = 'button';
                                btn.className = 'time-option';
                                btn.textContent = String(m).padStart(2, '0');
                                if (m === selectedMinute) btn.classList.add('selected');
                                btn.onclick = (e) => {
                                    e.stopPropagation();
                                    selectedMinute = m;
                                    renderTime();
                                    updateInput();
                                };
                                minScroll.appendChild(btn);
                            }

                            // AM/PM buttons
                            ampmContainer.innerHTML = '';
                            ['AM', 'PM'].forEach(period => {
                                const btn = document.createElement('button');
                                btn.type = 'button';
                                btn.className = 'time-option time-ampm-btn';
                                btn.textContent = period;
                                const isSelected = (period === 'PM') === isPM;
                                if (isSelected) btn.classList.add('selected');
                                btn.onclick = (e) => {
                                    e.stopPropagation();
                                    const newIsPM = period === 'PM';
                                    selectedHour = to24Hour(displayHour, newIsPM);
                                    renderTime();
                                    updateInput();
                                };
                                ampmContainer.appendChild(btn);
                            });

                            // Scroll to selected
                            const selectedHourBtn = hourScroll.querySelector('.selected');
                            const selectedMinBtn = minScroll.querySelector('.selected');
                            if (selectedHourBtn) selectedHourBtn.scrollIntoView({ block: 'center' });
                            if (selectedMinBtn) selectedMinBtn.scrollIntoView({ block: 'center' });
                        }

                        function updateInput() {
                            // Display in 12-hour format
                            input.value = formatDisplayTime(selectedHour, selectedMinute);
                            // Store 24-hour format in data attribute for form submission
                            input.dataset.value24 = formatStorageTime(selectedHour, selectedMinute);
                        }


                        function showPopup() {
                            renderTime();
                            popup.hidden = false;
                        }

                        function hidePopup() {
                            popup.hidden = true;
                        }

                        // Event handlers
                        input.addEventListener('click', showPopup);
                        trigger.addEventListener('click', showPopup);

                        nowBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const now = new Date();
                            selectedHour = now.getHours();
                            selectedMinute = Math.floor(now.getMinutes() / 5) * 5;
                            updateInput();
                            hidePopup();
                        });

                        // Close on click outside
                        document.addEventListener('click', (e) => {
                            if (!wrapper.contains(e.target)) {
                                hidePopup();
                            }
                        });

                        // Close on ESC
                        document.addEventListener('keydown', (e) => {
                            if (e.key === 'Escape') {
                                hidePopup();
                            }
                        });
                    });
                }

                initTimePickers();
            });
        "
        </script>


    }
}
