//! Finance Module Stub
//!
//! Placeholder for the Finance Management module.
//! Will handle budgets, expenses, and financial reporting.

use leptos::prelude::*;
use leptos::IntoView;

/// Finance module placeholder component
#[component]
pub fn FinanceModule() -> impl IntoView {
    view! {
        <div class="module-stub">
            <div class="module-stub-header">
                <span class="module-stub-icon">"💰"</span>
                <h1 class="module-stub-title">"Finance Management"</h1>
            </div>
            <div class="module-stub-content">
                <p class="module-stub-description">
                    "Track budgets, expenses, and financial performance. Generate reports and manage cost centers."
                </p>
                <div class="module-stub-features">
                    <h3>"Planned Features"</h3>
                    <ul>
                        <li>"Budget Planning"</li>
                        <li>"Expense Tracking"</li>
                        <li>"Cost Center Management"</li>
                        <li>"Financial Reports"</li>
                        <li>"Forecasting"</li>
                    </ul>
                </div>
                <div class="module-stub-cta">
                    <span class="coming-soon-label">"Coming Soon"</span>
                </div>
            </div>
        </div>
    }
}
