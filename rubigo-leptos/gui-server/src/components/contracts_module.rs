//! Contracts Module Stub
//!
//! Placeholder for the Contract Management module.
//! Will handle vendor contracts, agreements, and compliance tracking.

use leptos::prelude::*;
use leptos::IntoView;

/// Contracts module placeholder component
#[component]
pub fn ContractsModule() -> impl IntoView {
    view! {
        <div class="module-stub">
            <div class="module-stub-header">
                <span class="module-stub-icon">"📄"</span>
                <h1 class="module-stub-title">"Contract Management"</h1>
            </div>
            <div class="module-stub-content">
                <p class="module-stub-description">
                    "Manage vendor contracts, service agreements, and compliance requirements. Track renewals and obligations."
                </p>
                <div class="module-stub-features">
                    <h3>"Planned Features"</h3>
                    <ul>
                        <li>"Contract Repository"</li>
                        <li>"Vendor Management"</li>
                        <li>"Renewal Tracking"</li>
                        <li>"Compliance Monitoring"</li>
                        <li>"Document Templates"</li>
                    </ul>
                </div>
                <div class="module-stub-cta">
                    <span class="coming-soon-label">"Coming Soon"</span>
                </div>
            </div>
        </div>
    }
}
