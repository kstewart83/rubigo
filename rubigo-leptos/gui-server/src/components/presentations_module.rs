//! Presentations Module Stub
//!
//! Placeholder for the Presentation Management module.
//! Will handle slides, decks, and presentation delivery.

use leptos::prelude::*;
use leptos::IntoView;

/// Presentations module placeholder component
#[component]
pub fn PresentationsModule() -> impl IntoView {
    view! {
        <div class="module-stub">
            <div class="module-stub-header">
                <span class="module-stub-icon">"📽️"</span>
                <h1 class="module-stub-title">"Presentation Management"</h1>
            </div>
            <div class="module-stub-content">
                <p class="module-stub-description">
                    "Create and manage presentations. Build slide decks, collaborate on content, and deliver with confidence."
                </p>
                <div class="module-stub-features">
                    <h3>"Planned Features"</h3>
                    <ul>
                        <li>"Slide Builder"</li>
                        <li>"Template Library"</li>
                        <li>"Collaboration"</li>
                        <li>"Presenter Mode"</li>
                        <li>"Analytics"</li>
                    </ul>
                </div>
                <div class="module-stub-cta">
                    <span class="coming-soon-label">"Coming Soon"</span>
                </div>
            </div>
        </div>
    }
}
