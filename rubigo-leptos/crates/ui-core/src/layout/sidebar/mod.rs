//! Sidebar Component
//!
//! Navigation sidebar with router-aware active state.

#![allow(dead_code)]

use leptos::prelude::*;
use leptos_router::components::A;
use leptos_router::hooks::use_location;

stylance::import_crate_style!(style, "src/layout/sidebar/sidebar.module.css");

/// A single navigation item in the sidebar
#[derive(Debug, Clone)]
pub struct NavItem {
    pub id: &'static str,
    pub label: &'static str,
    pub icon: &'static str, // Emoji or icon identifier
    pub href: &'static str,
}

/// Sidebar navigation component
#[component]
pub fn Sidebar(
    /// List of navigation items
    items: Vec<NavItem>,
) -> impl IntoView {
    let location = use_location();

    view! {
        <aside class=style::sidebar>
            <nav class=style::sidebar_nav>
                {items.into_iter().map(|item| {
                    let href = item.href;
                    let is_active = move || {
                        let path = location.pathname.get();
                        if href == "/" {
                            path == "/"
                        } else {
                            path.starts_with(href)
                        }
                    };

                    view! {
                        <A
                            href=item.href
                            {..}
                            class=move || {
                                if is_active() {
                                    format!("{} {}", style::nav_item, style::nav_item_active)
                                } else {
                                    style::nav_item.to_string()
                                }
                            }
                        >
                            <span class=style::nav_icon>{item.icon}</span>
                            <span class=style::nav_label>{item.label}</span>
                        </A>
                    }
                }).collect::<Vec<_>>()}
            </nav>

            <div class=style::sidebar_footer>
                "v0.1.0"
            </div>
        </aside>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn nav_item_creation() {
        let item = NavItem {
            id: "home",
            label: "Home",
            icon: "🏠",
            href: "/",
        };
        assert_eq!(item.id, "home");
    }
}
