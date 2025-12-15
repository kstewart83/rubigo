//! User Session Widget - Header widget for user authentication state
//!
//! Displays the current user's avatar and name when signed in,
//! with a dropdown menu for sign out and persona switching.

use leptos::prelude::*;
use leptos::IntoView;

/// User session widget for the header
#[component]
pub fn UserSessionWidget(current_persona: Option<String>) -> impl IntoView {
    match current_persona {
        Some(name) => {
            // Get initials for avatar
            let initials: String = name
                .split_whitespace()
                .filter_map(|w| w.chars().next())
                .take(2)
                .collect();

            view! {
                <div class="user-session-widget" id="user-session-widget">
                    <button class="user-session-trigger" id="user-session-trigger">
                        <div class="user-avatar-small">
                            <span class="avatar-initials">{initials}</span>
                        </div>
                        <span class="user-name">{name.clone()}</span>
                        <svg class="dropdown-chevron" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                        </svg>
                    </button>
                    <div class="user-dropdown" id="user-dropdown">
                        <button class="user-dropdown-item" id="switch-persona-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                            "Switch Persona"
                        </button>
                        <button class="user-dropdown-item user-dropdown-item--danger" id="sign-out-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                <polyline points="16 17 21 12 16 7"/>
                                <line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                            "Sign Out"
                        </button>
                    </div>
                </div>

                <script>
                    r#"
                    document.addEventListener('DOMContentLoaded', function() {
                        const trigger = document.getElementById('user-session-trigger');
                        const dropdown = document.getElementById('user-dropdown');
                        const switchBtn = document.getElementById('switch-persona-btn');
                        const signOutBtn = document.getElementById('sign-out-btn');
                        const overlay = document.getElementById('dev-overlay');
                        const searchInput = document.getElementById('persona-search');
                        
                        if (!trigger || !dropdown) return;
                        
                        // Toggle dropdown
                        trigger.addEventListener('click', function(e) {
                            e.stopPropagation();
                            dropdown.classList.toggle('open');
                        });
                        
                        // Close dropdown on outside click
                        document.addEventListener('click', function() {
                            dropdown.classList.remove('open');
                        });
                        
                        // Switch persona - open overlay
                        if (switchBtn && overlay) {
                            switchBtn.addEventListener('click', function() {
                                dropdown.classList.remove('open');
                                overlay.classList.add('open');
                                if (searchInput) searchInput.focus();
                            });
                        }
                        
                        // Sign out
                        if (signOutBtn) {
                            signOutBtn.addEventListener('click', function() {
                                fetch('/api/persona', {
                                    method: 'DELETE'
                                }).then(() => {
                                    location.reload();
                                });
                            });
                        }
                    });
                    "#
                </script>
            }.into_any()
        }
        None => {
            // Not signed in - don't show widget
            view! { <span></span> }.into_any()
        }
    }
}
