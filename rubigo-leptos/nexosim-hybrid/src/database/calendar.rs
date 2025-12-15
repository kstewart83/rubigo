// Calendar/Meeting data models and repository
// This module handles calendar events, meetings, and their recurrence patterns

use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

/// Recurrence frequency for repeating meetings
#[derive(Debug, Serialize, Deserialize, Clone, Default, PartialEq)]
pub enum RecurrenceFrequency {
    #[default]
    None,
    Daily,
    Weekly,
    Monthly,
    Yearly,
}

impl std::fmt::Display for RecurrenceFrequency {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RecurrenceFrequency::None => write!(f, "none"),
            RecurrenceFrequency::Daily => write!(f, "daily"),
            RecurrenceFrequency::Weekly => write!(f, "weekly"),
            RecurrenceFrequency::Monthly => write!(f, "monthly"),
            RecurrenceFrequency::Yearly => write!(f, "yearly"),
        }
    }
}

impl From<&str> for RecurrenceFrequency {
    fn from(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "daily" => RecurrenceFrequency::Daily,
            "weekly" => RecurrenceFrequency::Weekly,
            "monthly" => RecurrenceFrequency::Monthly,
            "yearly" => RecurrenceFrequency::Yearly,
            _ => RecurrenceFrequency::None,
        }
    }
}

/// Meeting type for categorization
#[derive(Debug, Serialize, Deserialize, Clone, Default, PartialEq)]
pub enum MeetingType {
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
}

impl std::fmt::Display for MeetingType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MeetingType::Meeting => write!(f, "meeting"),
            MeetingType::Standup => write!(f, "standup"),
            MeetingType::AllHands => write!(f, "all-hands"),
            MeetingType::OneOnOne => write!(f, "1:1"),
            MeetingType::Training => write!(f, "training"),
            MeetingType::Interview => write!(f, "interview"),
            MeetingType::Holiday => write!(f, "holiday"),
            MeetingType::Conference => write!(f, "conference"),
            MeetingType::Review => write!(f, "review"),
            MeetingType::Planning => write!(f, "planning"),
        }
    }
}

impl From<&str> for MeetingType {
    fn from(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "standup" => MeetingType::Standup,
            "all-hands" | "allhands" => MeetingType::AllHands,
            "1:1" | "one-on-one" | "oneonone" => MeetingType::OneOnOne,
            "training" => MeetingType::Training,
            "interview" => MeetingType::Interview,
            "holiday" => MeetingType::Holiday,
            "conference" => MeetingType::Conference,
            "review" => MeetingType::Review,
            "planning" => MeetingType::Planning,
            _ => MeetingType::Meeting,
        }
    }
}

/// A calendar meeting/event
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Meeting {
    pub id: Option<Thing>,
    pub title: String,
    pub description: Option<String>,

    /// Start date/time in ISO 8601 format (e.g., "2025-01-15T09:00:00")
    pub start_time: String,
    /// End date/time in ISO 8601 format
    pub end_time: String,

    /// All-day event flag
    #[serde(default)]
    pub all_day: bool,

    /// Meeting type for styling/categorization
    #[serde(default)]
    pub meeting_type: MeetingType,

    /// Recurrence settings
    #[serde(default)]
    pub recurrence: RecurrenceFrequency,
    /// Interval for recurrence (e.g., every 2 weeks)
    #[serde(default = "default_interval")]
    pub recurrence_interval: u32,
    /// Days of week for weekly recurrence (e.g., ["Mon", "Wed", "Fri"])
    #[serde(default)]
    pub recurrence_days: Vec<String>,
    /// End date for recurrence (optional)
    #[serde(default)]
    pub recurrence_until: Option<String>,
    /// Number of occurrences (optional, alternative to until date)
    #[serde(default)]
    pub recurrence_count: Option<u32>,

    /// Location - space ID for physical location
    #[serde(default)]
    pub location_id: Option<Thing>,
    /// Virtual meeting URL
    #[serde(default)]
    pub virtual_url: Option<String>,

    /// Organizer person ID
    #[serde(default)]
    pub organizer_id: Option<Thing>,
    /// Participant person IDs
    #[serde(default)]
    pub participant_ids: Vec<Thing>,

    /// Timezone (e.g., "America/New_York")
    #[serde(default = "default_timezone")]
    pub timezone: String,
}

fn default_interval() -> u32 {
    1
}

fn default_timezone() -> String {
    "America/New_York".to_string()
}

pub struct CalendarRepository;

impl CalendarRepository {
    /// Get all meetings
    pub async fn get_all(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
    ) -> anyhow::Result<Vec<Meeting>> {
        let meetings: Vec<Meeting> = db.select("meeting").await?;
        Ok(meetings)
    }

    /// Create a new meeting
    pub async fn create(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        meeting: Meeting,
    ) -> anyhow::Result<Meeting> {
        let created: Option<Meeting> = db.create("meeting").content(meeting).await?;
        created.ok_or_else(|| anyhow::anyhow!("Failed to create meeting"))
    }
}
