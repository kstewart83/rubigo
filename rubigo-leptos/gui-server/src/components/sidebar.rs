//! Sidebar Navigation Component
//!
//! A collapsible sidebar for module navigation, replacing the horizontal tab bar.
//! Features icons, labels, and glassmorphism styling.

use leptos::prelude::*;
use leptos::IntoView;

/// A single sidebar navigation item
#[derive(Clone)]
pub enum SidebarIcon {
    Emoji(&'static str),
    Svg(&'static str),
}

/// A single sidebar navigation item
#[derive(Clone)]
pub struct SidebarItem {
    pub id: &'static str,
    pub label: &'static str,
    pub icon: SidebarIcon,
    pub href: &'static str,
    pub coming_soon: bool,
}

/// Sidebar navigation component
///
/// # Props
/// - `active_tab`: Currently active tab ID
#[component]
pub fn Sidebar(active_tab: String) -> impl IntoView {
    let items = get_sidebar_items();

    view! {
        <aside class="sidebar" id="sidebar">
            <nav class="sidebar-nav">
                {items.into_iter().map(|item| {
                    let is_active = active_tab == item.id;
                    let class = if is_active {
                        "sidebar-item active"
                    } else if item.coming_soon {
                        "sidebar-item coming-soon"
                    } else {
                        "sidebar-item"
                    };

                    let icon_view = match item.icon {
                        SidebarIcon::Emoji(emoji) => view! {
                            <span class="sidebar-icon">{emoji}</span>
                        }.into_any(),
                        SidebarIcon::Svg(path) => view! {
                            <span class="sidebar-icon svg-icon" style=format!("--icon-url: url('{}')", path)></span>
                        }.into_any(),
                    };

                    if item.coming_soon {
                        view! {
                            <div class=class title=item.label>
                                {icon_view}
                                <span class="sidebar-label">{item.label}</span>
                                <span class="sidebar-badge">"Soon"</span>
                            </div>
                        }.into_any()
                    } else {
                        view! {
                            <a href=item.href class=class title=item.label>
                                {icon_view}
                                <span class="sidebar-label">{item.label}</span>
                            </a>
                        }.into_any()
                    }
                }).collect_view()}
            </nav>
        </aside>
    }
}

fn get_sidebar_items() -> Vec<SidebarItem> {
    vec![
        // Core navigation
        SidebarItem {
            id: "home",
            label: "Home",
            icon: SidebarIcon::Svg("/assets/icons/home.svg"),
            href: "/?tab=home",
            coming_soon: false,
        },
        SidebarItem {
            id: "personnel",
            label: "Personnel",
            icon: SidebarIcon::Emoji("👥"),
            href: "/?tab=personnel",
            coming_soon: false,
        },
        SidebarItem {
            id: "sites",
            label: "Sites",
            icon: SidebarIcon::Emoji("🌍"),
            href: "/?tab=sites",
            coming_soon: false,
        },
        SidebarItem {
            id: "assets",
            label: "Assets",
            icon: SidebarIcon::Emoji("📦"),
            href: "/?tab=assets",
            coming_soon: false,
        },
        SidebarItem {
            id: "components",
            label: "Components",
            icon: SidebarIcon::Emoji("🖥️"),
            href: "/?tab=components",
            coming_soon: false,
        },
        SidebarItem {
            id: "connections",
            label: "Connections",
            icon: SidebarIcon::Emoji("🔗"),
            href: "/?tab=connections",
            coming_soon: false,
        },
        SidebarItem {
            id: "simulation",
            label: "Simulation",
            icon: SidebarIcon::Emoji("⚙️"),
            href: "/?tab=simulation",
            coming_soon: false,
        },
        SidebarItem {
            id: "metrics",
            label: "Metrics",
            icon: SidebarIcon::Emoji("📈"),
            href: "/?tab=metrics",
            coming_soon: false,
        },
        // New modules (stub pages)
        SidebarItem {
            id: "tasks",
            label: "Tasks",
            icon: SidebarIcon::Emoji("✅"),
            href: "/?tab=tasks",
            coming_soon: false,
        },
        SidebarItem {
            id: "contracts",
            label: "Contracts",
            icon: SidebarIcon::Emoji("📄"),
            href: "/?tab=contracts",
            coming_soon: false,
        },
        SidebarItem {
            id: "finance",
            label: "Finance",
            icon: SidebarIcon::Emoji("💰"),
            href: "/?tab=finance",
            coming_soon: false,
        },
        SidebarItem {
            id: "risk",
            label: "Risk",
            icon: SidebarIcon::Emoji("⚠️"),
            href: "/?tab=risk",
            coming_soon: false,
        },
        SidebarItem {
            id: "requirements",
            label: "Requirements",
            icon: SidebarIcon::Emoji("📋"),
            href: "/?tab=requirements",
            coming_soon: false,
        },
        SidebarItem {
            id: "development",
            label: "Development",
            icon: SidebarIcon::Emoji("💻"),
            href: "/?tab=development",
            coming_soon: false,
        },
        SidebarItem {
            id: "calendar",
            label: "Calendar",
            icon: SidebarIcon::Emoji("📅"),
            href: "/?tab=calendar",
            coming_soon: false,
        },
        SidebarItem {
            id: "chat",
            label: "Chat",
            icon: SidebarIcon::Emoji("💬"),
            href: "/?tab=chat",
            coming_soon: false,
        },
        SidebarItem {
            id: "email",
            label: "Email",
            icon: SidebarIcon::Emoji("📧"),
            href: "/?tab=email",
            coming_soon: false,
        },
        SidebarItem {
            id: "meetings",
            label: "Meetings",
            icon: SidebarIcon::Emoji("🤝"),
            href: "/?tab=meetings",
            coming_soon: false,
        },
        SidebarItem {
            id: "presentations",
            label: "Presentations",
            icon: SidebarIcon::Emoji("📽️"),
            href: "/?tab=presentations",
            coming_soon: false,
        },
    ]
}
