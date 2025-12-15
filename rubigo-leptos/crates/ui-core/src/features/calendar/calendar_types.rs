//! Calendar Data Types
//!
//! Core types for calendar events, recurrence, and display.

use chrono::{DateTime, Datelike, Duration, NaiveDate, Utc, Weekday};
use std::collections::HashMap;

/// Event type with associated colors
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum EventType {
    #[default]
    Meeting,
    Standup,
    AllHands,
    OneOnOne,
    Training,
    Interview,
    Holiday,
    Conference,
    Review,
    Planning,
    Appointment,
    Reminder,
    OutOfOffice,
}

impl EventType {
    /// Get the color associated with this event type
    pub fn color(&self) -> &'static str {
        match self {
            EventType::Standup => "#10b981",     // Green
            EventType::AllHands => "#8b5cf6",    // Purple
            EventType::OneOnOne => "#3b82f6",    // Blue
            EventType::Training => "#f59e0b",    // Amber
            EventType::Interview => "#6366f1",   // Indigo
            EventType::Holiday => "#ef4444",     // Red
            EventType::Conference => "#ec4899",  // Pink
            EventType::Review => "#14b8a6",      // Teal
            EventType::Planning => "#f97316",    // Orange
            EventType::Meeting => "#6b7280",     // Gray
            EventType::Appointment => "#10b981", // Emerald
            EventType::Reminder => "#f59e0b",    // Amber
            EventType::OutOfOffice => "#ef4444", // Red
        }
    }

    /// Get display name
    pub fn display_name(&self) -> &'static str {
        match self {
            EventType::Standup => "Standup",
            EventType::AllHands => "All Hands",
            EventType::OneOnOne => "One on One",
            EventType::Training => "Training",
            EventType::Interview => "Interview",
            EventType::Holiday => "Holiday",
            EventType::Conference => "Conference",
            EventType::Review => "Review",
            EventType::Planning => "Planning",
            EventType::Meeting => "Meeting",
            EventType::Appointment => "Appointment",
            EventType::Reminder => "Reminder",
            EventType::OutOfOffice => "Out of Office",
        }
    }
}

/// Recurrence frequency
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum RecurrenceFrequency {
    #[default]
    None,
    Daily,
    Weekly,
    Monthly,
    Yearly,
}

/// Minimal person info for display in events
#[derive(Debug, Clone, PartialEq)]
pub struct ParticipantInfo {
    pub id: String,
    pub name: String,
}

impl ParticipantInfo {
    pub fn new(id: impl Into<String>, name: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
        }
    }
}

/// Represents a deviation/exception for a specific instance of a recurring event
#[derive(Debug, Clone, PartialEq, Default)]
pub struct InstanceDeviation {
    /// The original occurrence date this deviation applies to (YYYY-MM-DD format)
    pub original_date: String,

    /// If true, this instance is cancelled/deleted
    pub cancelled: bool,

    /// Override start time (if different from series)
    pub start_time: Option<DateTime<Utc>>,

    /// Override end time (if different from series)
    pub end_time: Option<DateTime<Utc>>,

    /// Override description
    pub description: Option<String>,

    /// Override location
    pub location: Option<String>,

    /// Override timezone
    pub timezone: Option<String>,

    /// Override organizers (None = use series organizers)
    pub organizers: Option<Vec<ParticipantInfo>>,

    /// Override participants (None = use series participants)
    pub participants: Option<Vec<ParticipantInfo>>,
}

impl InstanceDeviation {
    /// Create a cancellation deviation
    pub fn cancelled(date: NaiveDate) -> Self {
        Self {
            original_date: date.format("%Y-%m-%d").to_string(),
            cancelled: true,
            ..Default::default()
        }
    }

    /// Create an empty deviation for a date (for modifications)
    pub fn for_date(date: NaiveDate) -> Self {
        Self {
            original_date: date.format("%Y-%m-%d").to_string(),
            ..Default::default()
        }
    }
}

/// Computed data for a specific instance (after applying deviations)
#[derive(Debug, Clone)]
pub struct InstanceData {
    pub date: NaiveDate,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub description: Option<String>,
    pub location: Option<String>,
    pub timezone: String,
    pub organizers: Vec<ParticipantInfo>,
    pub participants: Vec<ParticipantInfo>,
    pub has_deviation: bool,
}

/// A calendar event for display
#[derive(Debug, Clone, PartialEq)]
pub struct CalendarEvent {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub location: Option<String>,
    pub event_type: EventType,
    pub recurrence: RecurrenceFrequency,
    pub recurrence_days: Vec<String>, // e.g., ["Mon", "Wed", "Fri"]
    pub recurrence_until: Option<DateTime<Utc>>,
    pub timezone: String, // e.g., "America/New_York"
    pub organizers: Vec<ParticipantInfo>,
    pub participants: Vec<ParticipantInfo>,
    /// Instance-specific deviations for recurring events
    /// Key is the original occurrence date in "YYYY-MM-DD" format
    pub deviations: HashMap<String, InstanceDeviation>,
    /// Whether the entire event/series has been deleted (soft delete)
    pub deleted: bool,
}

impl CalendarEvent {
    /// Create a new event
    pub fn new(
        id: impl Into<String>,
        title: impl Into<String>,
        start: DateTime<Utc>,
        end: DateTime<Utc>,
    ) -> Self {
        Self {
            id: id.into(),
            title: title.into(),
            description: None,
            start_time: start,
            end_time: end,
            location: None,
            event_type: EventType::Meeting,
            recurrence: RecurrenceFrequency::None,
            recurrence_days: vec![],
            recurrence_until: None,
            timezone: "America/New_York".to_string(),
            organizers: vec![],
            participants: vec![],
            deviations: HashMap::new(),
            deleted: false,
        }
    }

    /// Check if this event occurs on the given date (considering recurrence and cancellations)
    pub fn occurs_on(&self, date: NaiveDate) -> bool {
        // Check if entire event is deleted
        if self.deleted {
            return false;
        }

        // Check if this specific instance is cancelled
        let date_key = date.format("%Y-%m-%d").to_string();
        if let Some(deviation) = self.deviations.get(&date_key) {
            if deviation.cancelled {
                return false;
            }
        }

        let event_date = self.start_time.date_naive();

        // Exact match
        if event_date == date {
            return true;
        }

        // Must be after start date
        if date < event_date {
            return false;
        }

        // Check recurrence end
        if let Some(until) = self.recurrence_until {
            if date > until.date_naive() {
                return false;
            }
        }

        match self.recurrence {
            RecurrenceFrequency::None => false,
            RecurrenceFrequency::Daily => true,
            RecurrenceFrequency::Weekly => {
                if self.recurrence_days.is_empty() {
                    // Same weekday as original
                    date.weekday() == event_date.weekday()
                } else {
                    // Specific days
                    let weekday_abbr = weekday_to_abbr(date.weekday());
                    self.recurrence_days.iter().any(|d| d == weekday_abbr)
                }
            }
            RecurrenceFrequency::Monthly => date.day() == event_date.day(),
            RecurrenceFrequency::Yearly => {
                date.month() == event_date.month() && date.day() == event_date.day()
            }
        }
    }

    /// Get the computed data for a specific instance, applying any deviations
    pub fn get_instance_data(&self, date: NaiveDate) -> Option<InstanceData> {
        if !self.occurs_on(date) {
            return None;
        }

        let date_key = date.format("%Y-%m-%d").to_string();
        let deviation = self.deviations.get(&date_key);

        Some(InstanceData {
            date,
            start_time: deviation
                .and_then(|d| d.start_time)
                .unwrap_or(self.start_time),
            end_time: deviation.and_then(|d| d.end_time).unwrap_or(self.end_time),
            description: deviation
                .and_then(|d| d.description.clone())
                .or_else(|| self.description.clone()),
            location: deviation
                .and_then(|d| d.location.clone())
                .or_else(|| self.location.clone()),
            timezone: deviation
                .and_then(|d| d.timezone.clone())
                .unwrap_or_else(|| self.timezone.clone()),
            organizers: deviation
                .and_then(|d| d.organizers.clone())
                .unwrap_or_else(|| self.organizers.clone()),
            participants: deviation
                .and_then(|d| d.participants.clone())
                .unwrap_or_else(|| self.participants.clone()),
            has_deviation: deviation.is_some(),
        })
    }

    /// Cancel a specific instance of this recurring event
    pub fn cancel_instance(&mut self, date: NaiveDate) {
        let date_key = date.format("%Y-%m-%d").to_string();
        self.deviations
            .insert(date_key.clone(), InstanceDeviation::cancelled(date));
    }

    /// Delete the entire event/series
    pub fn delete(&mut self) {
        self.deleted = true;
    }

    /// Check if this is a recurring event
    pub fn is_recurring(&self) -> bool {
        self.recurrence != RecurrenceFrequency::None
    }

    /// Get the start hour (0-23)
    pub fn start_hour(&self) -> u32 {
        self.start_time
            .format("%H")
            .to_string()
            .parse()
            .unwrap_or(9)
    }

    /// Get the start minute
    pub fn start_minute(&self) -> u32 {
        self.start_time
            .format("%M")
            .to_string()
            .parse()
            .unwrap_or(0)
    }

    /// Get the end hour (0-23)
    pub fn end_hour(&self) -> u32 {
        self.end_time.format("%H").to_string().parse().unwrap_or(10)
    }

    /// Get the end minute
    pub fn end_minute(&self) -> u32 {
        self.end_time.format("%M").to_string().parse().unwrap_or(0)
    }

    /// Format time range for display
    pub fn time_range_display(&self) -> String {
        let start = format_time_12h(self.start_hour(), self.start_minute());
        let end = format_time_12h(self.end_hour(), self.end_minute());
        format!("{} - {}", start, end)
    }
}

/// Convert weekday to 3-letter abbreviation
fn weekday_to_abbr(wd: Weekday) -> &'static str {
    match wd {
        Weekday::Mon => "Mon",
        Weekday::Tue => "Tue",
        Weekday::Wed => "Wed",
        Weekday::Thu => "Thu",
        Weekday::Fri => "Fri",
        Weekday::Sat => "Sat",
        Weekday::Sun => "Sun",
    }
}

/// Format time in 12-hour format
pub fn format_time_12h(hour: u32, minute: u32) -> String {
    let period = if hour >= 12 { "PM" } else { "AM" };
    let hour12 = if hour == 0 {
        12
    } else if hour > 12 {
        hour - 12
    } else {
        hour
    };
    if minute == 0 {
        format!("{}{}", hour12, period)
    } else {
        format!("{}:{:02}{}", hour12, minute, period)
    }
}

/// Get first day of month grid (Sunday before or on the 1st)
pub fn month_grid_start(year: i32, month: u32) -> NaiveDate {
    let first_of_month = NaiveDate::from_ymd_opt(year, month, 1).unwrap();
    let days_from_sunday = first_of_month.weekday().num_days_from_sunday();
    first_of_month - Duration::days(days_from_sunday as i64)
}

/// Generate all days for a month grid (42 days = 6 weeks)
pub fn month_grid_days(year: i32, month: u32, work_week: bool) -> Vec<NaiveDate> {
    let start = month_grid_start(year, month);
    let all_days: Vec<NaiveDate> = (0..42).map(|i| start + Duration::days(i)).collect();

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
}

/// Get week days for a given date
pub fn week_days(date: NaiveDate, work_week: bool) -> Vec<NaiveDate> {
    let days_from_sunday = date.weekday().num_days_from_sunday();
    let week_start = date - Duration::days(days_from_sunday as i64);

    if work_week {
        (1..6).map(|i| week_start + Duration::days(i)).collect()
    } else {
        (0..7).map(|i| week_start + Duration::days(i)).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    #[test]
    fn test_event_type_colors() {
        assert_eq!(EventType::Standup.color(), "#10b981");
        assert_eq!(EventType::Meeting.color(), "#6b7280");
    }

    #[test]
    fn test_format_time_12h() {
        assert_eq!(format_time_12h(9, 0), "9AM");
        assert_eq!(format_time_12h(12, 0), "12PM");
        assert_eq!(format_time_12h(13, 30), "1:30PM");
        assert_eq!(format_time_12h(0, 0), "12AM");
    }

    #[test]
    fn test_recurrence_daily() {
        let start = Utc.with_ymd_and_hms(2024, 12, 1, 9, 0, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2024, 12, 1, 10, 0, 0).unwrap();
        let mut event = CalendarEvent::new("1", "Daily Event", start, end);
        event.recurrence = RecurrenceFrequency::Daily;

        assert!(event.occurs_on(NaiveDate::from_ymd_opt(2024, 12, 1).unwrap()));
        assert!(event.occurs_on(NaiveDate::from_ymd_opt(2024, 12, 5).unwrap()));
        assert!(!event.occurs_on(NaiveDate::from_ymd_opt(2024, 11, 30).unwrap()));
    }

    #[test]
    fn test_recurrence_weekly() {
        let start = Utc.with_ymd_and_hms(2024, 12, 2, 9, 0, 0).unwrap(); // Monday
        let end = Utc.with_ymd_and_hms(2024, 12, 2, 10, 0, 0).unwrap();
        let mut event = CalendarEvent::new("1", "Weekly Event", start, end);
        event.recurrence = RecurrenceFrequency::Weekly;
        event.recurrence_days = vec!["Mon".to_string(), "Wed".to_string()];

        assert!(event.occurs_on(NaiveDate::from_ymd_opt(2024, 12, 2).unwrap())); // Mon
        assert!(event.occurs_on(NaiveDate::from_ymd_opt(2024, 12, 4).unwrap())); // Wed
        assert!(event.occurs_on(NaiveDate::from_ymd_opt(2024, 12, 9).unwrap())); // Next Mon
        assert!(!event.occurs_on(NaiveDate::from_ymd_opt(2024, 12, 3).unwrap()));
        // Tue
    }

    #[test]
    fn test_month_grid_days() {
        let days = month_grid_days(2024, 12, false);
        assert_eq!(days.len(), 42);

        let work_days = month_grid_days(2024, 12, true);
        assert_eq!(work_days.len(), 30); // 6 weeks * 5 days
    }

    #[test]
    fn test_cancel_instance() {
        let start = Utc.with_ymd_and_hms(2024, 12, 2, 9, 0, 0).unwrap(); // Monday
        let end = Utc.with_ymd_and_hms(2024, 12, 2, 10, 0, 0).unwrap();
        let mut event = CalendarEvent::new("1", "Weekly Event", start, end);
        event.recurrence = RecurrenceFrequency::Weekly;

        // Initially, Dec 9 should occur
        let dec_9 = NaiveDate::from_ymd_opt(2024, 12, 9).unwrap();
        assert!(event.occurs_on(dec_9));

        // Cancel Dec 9 instance
        event.cancel_instance(dec_9);

        // Now Dec 9 should NOT occur
        assert!(!event.occurs_on(dec_9));

        // But Dec 16 should still occur
        let dec_16 = NaiveDate::from_ymd_opt(2024, 12, 16).unwrap();
        assert!(event.occurs_on(dec_16));
    }

    #[test]
    fn test_delete_entire_event() {
        let start = Utc.with_ymd_and_hms(2024, 12, 2, 9, 0, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2024, 12, 2, 10, 0, 0).unwrap();
        let mut event = CalendarEvent::new("1", "One-time Event", start, end);

        // Initially, Dec 2 should occur
        let dec_2 = NaiveDate::from_ymd_opt(2024, 12, 2).unwrap();
        assert!(event.occurs_on(dec_2));

        // Delete the event
        event.delete();

        // Now Dec 2 should NOT occur
        assert!(!event.occurs_on(dec_2));
    }

    #[test]
    fn test_is_recurring() {
        let start = Utc.with_ymd_and_hms(2024, 12, 2, 9, 0, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2024, 12, 2, 10, 0, 0).unwrap();

        let mut event = CalendarEvent::new("1", "Event", start, end);
        assert!(!event.is_recurring());

        event.recurrence = RecurrenceFrequency::Daily;
        assert!(event.is_recurring());
    }

    #[test]
    fn test_get_instance_data_basic() {
        let start = Utc.with_ymd_and_hms(2024, 12, 2, 9, 0, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2024, 12, 2, 10, 0, 0).unwrap();
        let event = CalendarEvent::new("1", "Event", start, end);

        let dec_2 = NaiveDate::from_ymd_opt(2024, 12, 2).unwrap();
        let instance = event.get_instance_data(dec_2);

        assert!(instance.is_some());
        let data = instance.unwrap();
        assert_eq!(data.date, dec_2);
        assert!(!data.has_deviation);
    }

    #[test]
    fn test_get_instance_data_with_deviation() {
        let start = Utc.with_ymd_and_hms(2024, 12, 2, 9, 0, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2024, 12, 2, 10, 0, 0).unwrap();
        let mut event = CalendarEvent::new("1", "Weekly Event", start, end);
        event.recurrence = RecurrenceFrequency::Weekly;
        event.description = Some("Original description".to_string());

        let dec_9 = NaiveDate::from_ymd_opt(2024, 12, 9).unwrap();

        // Add a deviation with different description
        let mut deviation = InstanceDeviation::for_date(dec_9);
        deviation.description = Some("Modified description".to_string());
        event
            .deviations
            .insert(dec_9.format("%Y-%m-%d").to_string(), deviation);

        let instance = event.get_instance_data(dec_9);
        assert!(instance.is_some());
        let data = instance.unwrap();
        assert!(data.has_deviation);
        assert_eq!(data.description, Some("Modified description".to_string()));
    }

    #[test]
    fn test_get_instance_data_cancelled() {
        let start = Utc.with_ymd_and_hms(2024, 12, 2, 9, 0, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2024, 12, 2, 10, 0, 0).unwrap();
        let mut event = CalendarEvent::new("1", "Weekly Event", start, end);
        event.recurrence = RecurrenceFrequency::Weekly;

        let dec_9 = NaiveDate::from_ymd_opt(2024, 12, 9).unwrap();
        event.cancel_instance(dec_9);

        // Cancelled instance should return None
        let instance = event.get_instance_data(dec_9);
        assert!(instance.is_none());
    }
}
