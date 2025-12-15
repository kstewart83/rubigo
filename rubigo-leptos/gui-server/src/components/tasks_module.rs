//! Tasks Module Stub
//!
//! Placeholder for the Task Management module.
//! Will handle project tasks, assignments, and workflow automation.

use leptos::prelude::*;
use leptos::IntoView;

/// Tasks module placeholder component
#[component]
pub fn TasksModule() -> impl IntoView {
    view! {
        <div class="module-stub">
            <div class="module-stub-header">
                <span class="module-stub-icon">"✅"</span>
                <h1 class="module-stub-title">"Task Management"</h1>
            </div>
            <div class="module-stub-content">
                <p class="module-stub-description">
                    "Organize and track work across your organization. Assign tasks, set deadlines, and automate workflows."
                </p>
                <div class="module-stub-features">
                    <h3>"Planned Features"</h3>
                    <ul>
                        <li>"Task Boards (Kanban)"</li>
                        <li>"Project Planning"</li>
                        <li>"Assignment & Ownership"</li>
                        <li>"Due Date Tracking"</li>
                        <li>"Workflow Automation"</li>
                    </ul>
                </div>
                <div class="module-stub-cta">
                    <span class="coming-soon-label">"Coming Soon"</span>
                </div>
            </div>
        </div>
    }
}
