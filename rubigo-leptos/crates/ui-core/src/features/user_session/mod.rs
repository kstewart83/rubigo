//! User Session Module
//!
//! Provides user authentication and identity switching for development mode.
//! Includes sign-in screen, persona switcher overlay, and user session widget.

mod persona_switcher;
mod sign_in_screen;
mod user_session_widget;

pub use persona_switcher::PersonaSwitcher;
pub use sign_in_screen::SignInScreen;
pub use user_session_widget::UserSessionWidget;

/// User information for display and session management
#[derive(Debug, Clone, PartialEq, Default)]
pub struct UserInfo {
    pub id: String,
    pub name: String,
    pub title: Option<String>,
    pub department: Option<String>,
}

impl UserInfo {
    /// Create a new UserInfo
    pub fn new(id: impl Into<String>, name: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            title: None,
            department: None,
        }
    }

    /// Add title
    pub fn with_title(mut self, title: impl Into<String>) -> Self {
        self.title = Some(title.into());
        self
    }

    /// Add department
    pub fn with_department(mut self, department: impl Into<String>) -> Self {
        self.department = Some(department.into());
        self
    }

    /// Get initials for avatar display
    pub fn initials(&self) -> String {
        self.name
            .split_whitespace()
            .filter_map(|w| w.chars().next())
            .take(2)
            .collect::<String>()
            .to_uppercase()
    }
}
