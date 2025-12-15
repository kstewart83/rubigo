//! UI Features - Domain-Specific Components
//!
//! Features are composed components that implement specific
//! domain functionality like Personnel, Assets, Calendar, etc.

pub mod calendar;
pub mod personnel;
pub mod sites;
pub mod user_session;

pub use calendar::{CalendarEvent, CalendarHeader, CalendarPage, EventType, MonthView, WeekView};
pub use personnel::{EmployeeCard, PersonnelPage};
pub use sites::SitesPage;
pub use user_session::{PersonaSwitcher, SignInScreen, UserInfo, UserSessionWidget};
