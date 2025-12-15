//! Landing Page Component
//!
//! The main bento box dashboard layout that serves as the Rubigo home page.
//! Uses a CSS grid layout with role-based widget configuration.

use leptos::prelude::*;
use leptos::IntoView;
use nexosim_hybrid::config::RoleType;
use nexosim_hybrid::database::geo::Person;

use super::activity_widget::{ActivityItem, ActivityWidget};
use super::quick_actions::{QuickAction, QuickActionsWidget};
use super::stats_widget::StatsWidget;
use super::widget_card::{WidgetCard, WidgetSize};

/// Landing page bento box dashboard
///
/// # Props
/// - `current_persona`: Currently selected persona (for role-based layout)
/// - `component_count`: Number of network components
/// - `region_count`: Number of regions
/// - `site_count`: Number of sites
/// - `building_count`: Number of buildings
#[component]
pub fn LandingPage(
    current_persona: Option<Person>,
    component_count: usize,
    region_count: usize,
    site_count: usize,
    building_count: usize,
) -> impl IntoView {
    // Get role for layout customization
    let role = current_persona
        .as_ref()
        .map(|p| p.role.clone())
        .unwrap_or(RoleType::Employee);

    // Sample activity items (in production, these would come from database)
    let activities = vec![
        ActivityItem {
            icon: "🌐".to_string(),
            message: "Network simulation completed".to_string(),
            time: "2 mins ago".to_string(),
            link: Some("/?tab=simulation".to_string()),
        },
        ActivityItem {
            icon: "📍".to_string(),
            message: format!("{} regions configured", region_count),
            time: "Just now".to_string(),
            link: Some("/?tab=sites".to_string()),
        },
        ActivityItem {
            icon: "🖥️".to_string(),
            message: format!("{} components online", component_count),
            time: "5 mins ago".to_string(),
            link: Some("/?tab=components".to_string()),
        },
    ];

    // Quick actions based on role
    let quick_actions = get_quick_actions_for_role(&role);

    view! {
        <div class="landing-page">
            <div class="bento-grid">
                // Large widget: Welcome/Overview
                <WidgetCard title="Welcome to Rubigo" size=WidgetSize::Large icon="🏠">
                    <div class="welcome-content">
                        <p class="welcome-message">
                            {current_persona.as_ref().map(|p| format!("Hello, {}!", p.name.split_whitespace().next().unwrap_or(&p.name))).unwrap_or_else(|| "Welcome!".to_string())}
                        </p>
                        <p class="welcome-subtitle">
                            {current_persona.as_ref().map(|p| format!("{} • {}", p.title, p.department)).unwrap_or_else(|| "Your enterprise management platform".to_string())}
                        </p>
                    </div>
                </WidgetCard>

                // Medium widget: Quick Stats
                <WidgetCard title="Quick Stats" size=WidgetSize::Medium icon="📊">
                    <div class="stats-grid">
                        <StatsWidget label="Regions" value=region_count.to_string() />
                        <StatsWidget label="Sites" value=site_count.to_string() />
                        <StatsWidget label="Buildings" value=building_count.to_string() />
                        <StatsWidget label="Components" value=component_count.to_string() />
                    </div>
                </WidgetCard>

                // Medium widget: Quick Actions
                <WidgetCard title="Quick Actions" size=WidgetSize::Medium icon="⚡">
                    <QuickActionsWidget actions=quick_actions />
                </WidgetCard>

                // Medium widget: Recent Activity
                <WidgetCard title="Recent Activity" size=WidgetSize::Medium icon="📋">
                    <ActivityWidget items=activities />
                </WidgetCard>
            </div>
        </div>
    }
}

fn get_quick_actions_for_role(role: &RoleType) -> Vec<QuickAction> {
    match role {
        RoleType::ITAdmin | RoleType::Engineer => vec![
            QuickAction {
                label: "Run Simulation".to_string(),
                icon: "▶️".to_string(),
                href: "/?tab=simulation".to_string(),
            },
            QuickAction {
                label: "Add Component".to_string(),
                icon: "➕".to_string(),
                href: "/?tab=components".to_string(),
            },
            QuickAction {
                label: "View Network".to_string(),
                icon: "🌐".to_string(),
                href: "/?tab=sites".to_string(),
            },
            QuickAction {
                label: "Check Metrics".to_string(),
                icon: "📊".to_string(),
                href: "/?tab=metrics".to_string(),
            },
        ],
        RoleType::Executive => vec![
            QuickAction {
                label: "View Overview".to_string(),
                icon: "📊".to_string(),
                href: "/?tab=sites".to_string(),
            },
            QuickAction {
                label: "Reports".to_string(),
                icon: "📈".to_string(),
                href: "/?tab=metrics".to_string(),
            },
            QuickAction {
                label: "Simulations".to_string(),
                icon: "⚙️".to_string(),
                href: "/?tab=simulation".to_string(),
            },
        ],
        RoleType::SecurityAnalyst => vec![
            QuickAction {
                label: "Security Scan".to_string(),
                icon: "🛡️".to_string(),
                href: "/?tab=simulation".to_string(),
            },
            QuickAction {
                label: "Network Map".to_string(),
                icon: "🌐".to_string(),
                href: "/?tab=sites".to_string(),
            },
            QuickAction {
                label: "Connections".to_string(),
                icon: "🔗".to_string(),
                href: "/?tab=connections".to_string(),
            },
        ],
        _ => vec![
            QuickAction {
                label: "View Map".to_string(),
                icon: "🌍".to_string(),
                href: "/?tab=sites".to_string(),
            },
            QuickAction {
                label: "Components".to_string(),
                icon: "🖥️".to_string(),
                href: "/?tab=components".to_string(),
            },
            QuickAction {
                label: "Simulation".to_string(),
                icon: "⚙️".to_string(),
                href: "/?tab=simulation".to_string(),
            },
        ],
    }
}
