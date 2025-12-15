//! Header Component
//!
//! Main application header with Rubigo branding, status, and user controls.

#![allow(dead_code)]

use crate::features::user_session::{UserInfo, UserSessionWidget};
use leptos::prelude::*;

stylance::import_crate_style!(style, "src/layout/header/header.module.css");

/// Connection status for the header
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConnectionStatus {
    Connected,
    Disconnected,
}

/// Header component with Rubigo branding
#[component]
pub fn Header(
    /// Connection status
    #[prop(default = ConnectionStatus::Connected)]
    status: ConnectionStatus,
    /// Current user (if authenticated)
    current_user: Option<UserInfo>,
    /// Callback to open persona switcher
    on_switch_identity: Callback<()>,
    /// Callback to sign out
    on_sign_out: Callback<()>,
) -> impl IntoView {
    let status_class = match status {
        ConnectionStatus::Connected => format!("{} connected", style::status_indicator),
        ConnectionStatus::Disconnected => format!("{} disconnected", style::status_indicator),
    };

    let status_text = match status {
        ConnectionStatus::Connected => "Connected",
        ConnectionStatus::Disconnected => "Disconnected",
    };

    view! {
        <header class=style::header>
            <div class=style::header_left>
                <a href="/" class=style::header_logo>
                    // Rubigo Logo SVG (inline for simplicity)
                    <svg class=style::logo_icon width="28" height="28" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="headerRustGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#FF8A65;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#BF360C;stop-opacity:1" />
                            </linearGradient>
                            <linearGradient id="headerIronGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#CFD8DC;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#546E7A;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        <g stroke="#455A64" stroke-width="24" stroke-linecap="round" opacity="0.8">
                            <line x1="256" y1="256" x2="256" y2="110" />
                            <line x1="256" y1="256" x2="130" y2="380" />
                            <line x1="256" y1="256" x2="382" y2="380" />
                        </g>
                        <g>
                            <rect x="216" y="70" width="80" height="80" rx="16" fill="url(#headerRustGradient)" />
                            <rect x="90" y="340" width="80" height="80" rx="16" fill="url(#headerRustGradient)" />
                            <rect x="342" y="340" width="80" height="80" rx="16" fill="url(#headerRustGradient)" />
                            <rect x="206" y="206" width="100" height="100" rx="20" fill="url(#headerIronGradient)" stroke="#37474F" stroke-width="2"/>
                        </g>
                    </svg>
                    <span class=style::logo_text>"Rubigo"</span>
                </a>
            </div>

            <div class=style::header_center>
                // Tab navigation could go here
            </div>

            <div class=style::header_right>
                <div class=status_class>
                    <span class=style::status_dot></span>
                    {status_text}
                </div>

                {move || {
                    if let Some(user) = current_user.clone() {
                        view! {
                            <UserSessionWidget
                                user=user
                                on_switch_identity=on_switch_identity
                                on_sign_out=on_sign_out
                            />
                        }.into_any()
                    } else {
                        view! { <span></span> }.into_any()
                    }
                }}
            </div>
        </header>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn connection_status_variants() {
        assert_ne!(ConnectionStatus::Connected, ConnectionStatus::Disconnected);
    }
}
