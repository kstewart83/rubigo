//! Layout Component
//!
//! Main application layout with header, sidebar, and content area.

use leptos::prelude::*;

stylance::import_crate_style!(style, "src/layout/layout/layout.module.css");

use super::header::{ConnectionStatus, Header};
use super::sidebar::{NavItem, Sidebar};
use crate::features::user_session::UserInfo;

/// Main application layout
#[component]
pub fn Layout(
    /// Navigation items for sidebar
    nav_items: Vec<NavItem>,
    /// Connection status
    #[prop(default = ConnectionStatus::Connected)]
    status: ConnectionStatus,
    /// Current user (if authenticated)
    current_user: Option<UserInfo>,
    /// Callback to open persona switcher
    on_switch_identity: Callback<()>,
    /// Callback to sign out
    on_sign_out: Callback<()>,
    /// Page content
    children: Children,
) -> impl IntoView {
    view! {
        <div class=style::app_layout>
            <Header
                status=status
                current_user=current_user
                on_switch_identity=on_switch_identity
                on_sign_out=on_sign_out
            />

            <div class=style::layout_body>
                <Sidebar
                    items=nav_items
                />

                <main class=style::layout_main>
                    <div class=style::layout_content>
                        {children()}
                    </div>
                </main>
            </div>
        </div>
    }
}
