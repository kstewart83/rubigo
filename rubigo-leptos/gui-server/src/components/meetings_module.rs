//! Meetings Module Stub
//!
//! Placeholder for the Meeting Management module.
//! Will handle meeting scheduling, agendas, and minutes.

use leptos::prelude::*;
use leptos::IntoView;

/// Meetings module placeholder component
#[component]
pub fn MeetingsModule() -> impl IntoView {
    view! {
        <div class="module-stub">
            <div class="module-stub-header">
                <span class="module-stub-icon">"🤝"</span>
                <h1 class="module-stub-title">"Meeting Management"</h1>
            </div>
            <div class="module-stub-content">
                <p class="module-stub-description">
                    "Plan and manage meetings effectively. Create agendas, track attendance, and capture action items."
                </p>
                <div class="module-stub-features">
                    <h3>"Planned Features"</h3>
                    <ul>
                        <li>"Meeting Scheduler"</li>
                        <li>"Agenda Builder"</li>
                        <li>"Meeting Minutes"</li>
                        <li>"Action Item Tracking"</li>
                        <li>"Attendance Reports"</li>
                    </ul>
                </div>
                <div class="module-stub-cta">
                    <span class="coming-soon-label">"Coming Soon"</span>
                </div>
            </div>
        </div>
    }
}
