//! Primitives - L0 Atomic Components
//!
//! These are the building blocks that don't depend on other components.
//! Each primitive lives in its own folder with co-located CSS and tests.

pub mod avatar;
pub mod badge;
pub mod button;
pub mod checkbox;
pub mod date_input;
pub mod icon;
pub mod input;
pub mod person_search;
pub mod search_input;
pub mod select;
pub mod time_input;
pub mod timezone_select;

// Re-export components for convenient access
pub use avatar::{Avatar, AvatarSize};
pub use badge::{Badge, BadgeSize, BadgeVariant};
pub use button::{Button, ButtonSize, ButtonVariant};
pub use checkbox::Checkbox;
pub use date_input::DateInput;
pub use icon::{Icon, IconSize};
pub use input::{Input, InputSize, InputType};
pub use person_search::{PersonOption, PersonSearch};
pub use search_input::SearchInput;
pub use select::{Select, SelectOption, SelectSize};
pub use time_input::TimeInput;
pub use timezone_select::{
    get_browser_timezone, timezone_display_name, timezone_full_display, timezone_offset_minutes,
    TimezoneSelect,
};
