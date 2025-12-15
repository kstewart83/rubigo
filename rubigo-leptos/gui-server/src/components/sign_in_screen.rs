//! Sign In Screen - Displayed when no user is signed in
//!
//! Shows a centered sign-in card with a button to launch the persona selector.

use leptos::prelude::*;
use leptos::IntoView;

/// Sign-in screen shown when no persona is selected
#[component]
pub fn SignInScreen() -> impl IntoView {
    view! {
        <div class="sign-in-screen">
            <div class="sign-in-card">
                <div class="sign-in-logo">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                    </svg>
                </div>
                <h1 class="sign-in-title">"Welcome to Rubigo"</h1>
                <p class="sign-in-subtitle">"Sign in to access your dashboard"</p>
                <button class="btn btn-primary sign-in-btn" id="sign-in-btn">
                    "Sign In"
                </button>
            </div>
        </div>

        <script>
            r#"
            document.addEventListener('DOMContentLoaded', function() {
                const signInBtn = document.getElementById('sign-in-btn');
                const overlay = document.getElementById('dev-overlay');
                const searchInput = document.getElementById('persona-search');
                
                if (signInBtn && overlay) {
                    signInBtn.addEventListener('click', function() {
                        overlay.classList.add('open');
                        if (searchInput) searchInput.focus();
                    });
                }
            });
            "#
        </script>
    }
}
