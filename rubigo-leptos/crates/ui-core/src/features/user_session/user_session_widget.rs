//! User Session Widget Component
//!
//! Header widget displaying current user with dropdown menu.

use super::UserInfo;
use leptos::prelude::*;

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/features/user_session/user_session.module.css"
);

/// User session widget for the header
#[component]
pub fn UserSessionWidget(
    /// Current user info
    user: UserInfo,
    /// Callback to open persona switcher
    on_switch_identity: Callback<()>,
    /// Callback to sign out
    on_sign_out: Callback<()>,
) -> impl IntoView {
    let dropdown_open = RwSignal::new(false);
    let initials = user.initials();
    let name = user.name.clone();

    let toggle_dropdown = move |_: web_sys::MouseEvent| {
        dropdown_open.update(|open| *open = !*open);
    };

    let handle_switch = move |_: web_sys::MouseEvent| {
        dropdown_open.set(false);
        on_switch_identity.run(());
    };

    let handle_sign_out = move |_: web_sys::MouseEvent| {
        dropdown_open.set(false);
        on_sign_out.run(());
    };

    let dropdown_class = move || {
        if dropdown_open.get() {
            format!("{} user-dropdown open", style::user_dropdown)
        } else {
            format!("{} user-dropdown", style::user_dropdown)
        }
    };

    view! {
        <div id="user-session-widget" class=format!("{} user-session-widget", style::user_session_widget)>
            <button
                id="user-session-trigger"
                class=style::user_session_trigger
                on:click=toggle_dropdown
            >
                <div class=style::user_avatar>
                    <span class=style::user_avatar_initials>{initials}</span>
                </div>
                <span class=format!("{} user-name", style::user_name)>{name}</span>
                <span class=style::dropdown_arrow>"▼"</span>
            </button>

            <div id="user-dropdown" class=dropdown_class>
                <button
                    id="switch-persona-btn"
                    class=style::dropdown_item
                    on:click=handle_switch
                >
                    "🔄 Switch Identity"
                </button>
                <div class=style::dropdown_divider></div>
                <button
                    id="sign-out-btn"
                    class=format!("{} {}", style::dropdown_item, style::dropdown_item_danger)
                    on:click=handle_sign_out
                >
                    "🚪 Sign Out"
                </button>
            </div>
        </div>
    }
}
