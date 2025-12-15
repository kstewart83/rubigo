//! Calendar Feature Module
//!
//! Calendar views (Month, Week, Day) with event display, recurrence expansion,
//! and event creation/editing capabilities.

mod calendar_header;
mod calendar_page;
mod calendar_types;
mod day_view;
mod event_modal;
mod month_view;
mod week_view;

pub use calendar_header::CalendarHeader;
pub use calendar_page::CalendarPage;
pub use calendar_types::{CalendarEvent, EventType, ParticipantInfo, RecurrenceFrequency};
pub use day_view::DayView;
pub use event_modal::EventModal;
pub use month_view::MonthView;
pub use week_view::WeekView;
