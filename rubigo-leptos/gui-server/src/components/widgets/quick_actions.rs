//! Quick Actions Widget Component
//!
//! Provides a grid of quick action buttons for common tasks.

use leptos::prelude::*;
use leptos::IntoView;

/// A quick action button definition
#[derive(Clone)]
pub struct QuickAction {
    pub label: String,
    pub icon: String,
    pub href: String,
}

/// Quick actions widget with button grid
///
/// # Props
/// - `actions`: List of available quick actions
#[component]
pub fn QuickActionsWidget(actions: Vec<QuickAction>) -> impl IntoView {
    view! {
        <div class="quick-actions-widget">
            <div class="quick-actions-grid">
                {actions.into_iter().map(|action| {
                    view! {
                        <a href={action.href} class="quick-action-btn">
                            <span class="quick-action-icon">{action.icon}</span>
                            <span class="quick-action-label">{action.label}</span>
                        </a>
                    }
                }).collect_view()}
            </div>
        </div>
    }
}
