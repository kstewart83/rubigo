//! Activity Widget Component
//!
//! Displays a list of recent activity items with timestamps.

use leptos::prelude::*;
use leptos::IntoView;

/// A single activity item
#[derive(Clone)]
pub struct ActivityItem {
    pub icon: String,
    pub message: String,
    pub time: String,
    pub link: Option<String>,
}

/// Activity stream widget showing recent events
///
/// # Props
/// - `items`: List of recent activity items
/// - `max_items`: Maximum items to display (default 5)
#[component]
pub fn ActivityWidget(
    items: Vec<ActivityItem>,
    #[prop(default = 5)] max_items: usize,
) -> impl IntoView {
    let display_items: Vec<_> = items.into_iter().take(max_items).collect();

    view! {
        <div class="activity-widget">
            <ul class="activity-list">
                {display_items.into_iter().map(|item| {
                    view! {
                        <li class="activity-item">
                            <span class="activity-icon">{item.icon}</span>
                            <div class="activity-content">
                                <span class="activity-message">{item.message}</span>
                                <span class="activity-time">{item.time}</span>
                            </div>
                        </li>
                    }
                }).collect_view()}
            </ul>
        </div>
    }
}
