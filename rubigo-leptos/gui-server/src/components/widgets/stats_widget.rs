//! Stats Widget Component
//!
//! Displays a single statistic with label, value, and optional trend indicator.

use leptos::prelude::*;
use leptos::IntoView;

/// A simple stat display widget
///
/// # Props
/// - `label`: The stat label/name
/// - `value`: The stat value to display
/// - `trend`: Optional trend indicator ("up", "down", or "neutral")
/// - `trend_value`: Optional trend percentage or change value
#[component]
pub fn StatsWidget(
    label: &'static str,
    value: String,
    #[prop(optional)] trend: Option<&'static str>,
    #[prop(optional)] trend_value: Option<String>,
) -> impl IntoView {
    let trend_class = trend
        .map(|t| match t {
            "up" => "trend-up",
            "down" => "trend-down",
            _ => "trend-neutral",
        })
        .unwrap_or("trend-neutral");

    let trend_icon = trend.map(|t| match t {
        "up" => "↑",
        "down" => "↓",
        _ => "→",
    });

    view! {
        <div class="stats-widget">
            <div class="stats-value">{value}</div>
            <div class="stats-label">{label}</div>
            {trend_value.map(|tv| view! {
                <div class=format!("stats-trend {}", trend_class)>
                    <span class="trend-icon">{trend_icon.unwrap_or("→")}</span>
                    <span class="trend-value">{tv}</span>
                </div>
            })}
        </div>
    }
}

/// A group of stats in a row
#[component]
pub fn StatsRow(children: Children) -> impl IntoView {
    view! {
        <div class="stats-row">
            {children()}
        </div>
    }
}
