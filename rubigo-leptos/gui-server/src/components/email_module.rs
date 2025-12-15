//! Email Module Stub
//!
//! Placeholder for the Email module.
//! Will handle organizational email and communications.

use leptos::prelude::*;
use leptos::IntoView;

/// Email module placeholder component
#[component]
pub fn EmailModule() -> impl IntoView {
    view! {
        <div class="module-stub">
            <div class="module-stub-header">
                <span class="module-stub-icon">"📧"</span>
                <h1 class="module-stub-title">"Email"</h1>
            </div>
            <div class="module-stub-content">
                <p class="module-stub-description">
                    "Centralized email management. Send, receive, and organize communications across your organization."
                </p>
                <div class="module-stub-features">
                    <h3>"Planned Features"</h3>
                    <ul>
                        <li>"Inbox Management"</li>
                        <li>"Compose & Reply"</li>
                        <li>"Folders & Labels"</li>
                        <li>"Search"</li>
                        <li>"Templates"</li>
                    </ul>
                </div>
                <div class="module-stub-cta">
                    <span class="coming-soon-label">"Coming Soon"</span>
                </div>
            </div>
        </div>
    }
}
