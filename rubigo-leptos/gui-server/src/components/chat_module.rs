//! Chat Module Stub
//!
//! Placeholder for the Chat module.
//! Will handle team messaging and collaboration.

use leptos::prelude::*;
use leptos::IntoView;

/// Chat module placeholder component
#[component]
pub fn ChatModule() -> impl IntoView {
    view! {
        <div class="module-stub">
            <div class="module-stub-header">
                <span class="module-stub-icon">"💬"</span>
                <h1 class="module-stub-title">"Chat"</h1>
            </div>
            <div class="module-stub-content">
                <p class="module-stub-description">
                    "Real-time team communication. Direct messages, channels, and integrations with your workflow."
                </p>
                <div class="module-stub-features">
                    <h3>"Planned Features"</h3>
                    <ul>
                        <li>"Direct Messages"</li>
                        <li>"Team Channels"</li>
                        <li>"File Sharing"</li>
                        <li>"Thread Replies"</li>
                        <li>"Search & History"</li>
                    </ul>
                </div>
                <div class="module-stub-cta">
                    <span class="coming-soon-label">"Coming Soon"</span>
                </div>
            </div>
        </div>
    }
}
