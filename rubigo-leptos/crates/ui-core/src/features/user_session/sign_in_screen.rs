//! Sign In Screen Component
//!
//! Full-screen welcome screen shown when no user is authenticated.

use leptos::prelude::*;

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/features/user_session/user_session.module.css"
);

/// Sign-in screen with Rubigo branding
#[component]
pub fn SignInScreen(
    /// Callback when sign-in button is clicked
    on_sign_in: Callback<()>,
) -> impl IntoView {
    let handle_click = move |_: web_sys::MouseEvent| {
        on_sign_in.run(());
    };

    view! {
        <div class=format!("{} sign-in-screen", style::sign_in_screen)>
            <div class=style::sign_in_content>
                // Rubigo Logo
                <div class=style::sign_in_logo>
                    <svg width="80" height="80" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="rustGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#FF8A65;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#BF360C;stop-opacity:1" />
                            </linearGradient>
                            <linearGradient id="ironGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#CFD8DC;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#546E7A;stop-opacity:1" />
                            </linearGradient>
                            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                                <feOffset dx="0" dy="4" result="offsetblur"/>
                                <feComponentTransfer>
                                    <feFuncA type="linear" slope="0.3"/>
                                </feComponentTransfer>
                                <feMerge>
                                    <feMergeNode/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        <g stroke="#455A64" stroke-width="24" stroke-linecap="round" opacity="0.8">
                            <line x1="256" y1="256" x2="256" y2="110" />
                            <line x1="256" y1="256" x2="130" y2="380" />
                            <line x1="256" y1="256" x2="382" y2="380" />
                        </g>
                        <g filter="url(#shadow)">
                            <rect x="216" y="70" width="80" height="80" rx="16" fill="url(#rustGradient)" />
                            <rect x="90" y="340" width="80" height="80" rx="16" fill="url(#rustGradient)" />
                            <rect x="342" y="340" width="80" height="80" rx="16" fill="url(#rustGradient)" />
                            <rect x="206" y="206" width="100" height="100" rx="20" fill="url(#ironGradient)" stroke="#37474F" stroke-width="2"/>
                        </g>
                    </svg>
                </div>

                <h1 class=format!("{} sign-in-title", style::sign_in_title)>"Welcome to Rubigo"</h1>
                <p class=style::sign_in_subtitle>"Network Infrastructure Management"</p>

                <button
                    id="sign-in-btn"
                    class=style::sign_in_btn
                    on:click=handle_click
                >
                    "Sign In"
                </button>

                <p class=style::sign_in_hint>"Press Ctrl+Shift+D anytime to switch identity"</p>
            </div>
        </div>
    }
}
