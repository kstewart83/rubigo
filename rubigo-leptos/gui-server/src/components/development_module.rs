//! Development Management Module Stub
//!
//! Placeholder for the Development Management module.
//! Will handle development planning, sprints, and code management.

use leptos::prelude::*;
use leptos::IntoView;

/// Development Management module placeholder component
#[component]
pub fn DevelopmentModule() -> impl IntoView {
    view! {
        <div class="module-stub">
            <div class="module-stub-header">
                <span class="module-stub-icon">"💻"</span>
                <h1 class="module-stub-title">"Development Management"</h1>
            </div>
            <div class="module-stub-content">
                <p class="module-stub-description">
                    "Plan and track software development activities. Manage sprints, code reviews, and deployment pipelines."
                </p>
                <div class="module-stub-features">
                    <h3>"Planned Features"</h3>
                    <ul>
                        <li>"Sprint Planning"</li>
                        <li>"Code Reviews"</li>
                        <li>"CI/CD Pipelines"</li>
                        <li>"Release Management"</li>
                        <li>"Technical Debt Tracking"</li>
                    </ul>
                </div>
                <div class="module-stub-cta">
                    <span class="coming-soon-label">"Coming Soon"</span>
                </div>
            </div>
        </div>
    }
}
