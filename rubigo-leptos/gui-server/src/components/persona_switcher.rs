//! Persona Switcher Overlay - Overlay for selecting user identity
//!
//! This component renders a semi-transparent overlay for choosing a persona.

use leptos::prelude::*;
use leptos::IntoView;
use nexosim_hybrid::database::geo::Person;

/// Persona switcher overlay component with search and persona selection
#[component]
pub fn PersonaSwitcher(current_persona: Option<String>, people: Vec<Person>) -> impl IntoView {
    let current_name = current_persona
        .clone()
        .unwrap_or_else(|| "No persona".to_string());

    view! {
        // Overlay backdrop
        <div id="dev-overlay" class="dev-overlay">
            <div class="dev-overlay-content">
                <div class="dev-overlay-header">
                    <h2>"Select Identity"</h2>
                    <button id="dev-overlay-close" class="dev-overlay-close">"×"</button>
                </div>


                <div class="dev-overlay-section">
                    <h3>"Switch Persona"</h3>
                    <p class="dev-overlay-current">
                        "Currently viewing as: "
                        <strong>{current_name}</strong>
                    </p>

                    <input
                        type="text"
                        id="persona-search"
                        class="search-input persona-search"
                        placeholder="Search by name, title, or department..."
                    />

                    <div class="persona-grid" id="persona-grid">
                        {people.iter().map(|p| {
                            let name = p.name.clone();
                            let title = p.title.clone();
                            let department = p.department.clone();
                            let is_current = current_persona.as_ref().map(|c| c == &name).unwrap_or(false);
                            let card_class = if is_current { "persona-card current" } else { "persona-card" };

                            // Get initials for avatar
                            let initials: String = name.split_whitespace()
                                .filter_map(|w| w.chars().next())
                                .take(2)
                                .collect();

                            view! {
                                <div class=card_class data-name=name.clone() data-title=title.clone() data-department=department.clone()>
                                    <div class="persona-avatar">
                                        <span class="avatar-initials">{initials}</span>
                                    </div>
                                    <div class="persona-info">
                                        <div class="persona-name">{name.clone()}</div>
                                        <div class="persona-title">{title.clone()}</div>
                                        <div class="persona-dept">{department.clone()}</div>
                                    </div>
                                    {if is_current {
                                        view! { <span class="persona-current-badge">"Current"</span> }.into_any()
                                    } else {
                                        view! { <span></span> }.into_any()
                                    }}
                                </div>
                            }
                        }).collect_view()}
                    </div>
                </div>
            </div>
        </div>

        <script>
            r#"
            (function() {
                const overlay = document.getElementById('dev-overlay');
                const closeBtn = document.getElementById('dev-overlay-close');
                const searchInput = document.getElementById('persona-search');
                const personaGrid = document.getElementById('persona-grid');
                
                if (!overlay) return;
                
                // Close overlay
                closeBtn.addEventListener('click', function() {
                    overlay.classList.remove('open');
                });

                
                // Close on backdrop click
                overlay.addEventListener('click', function(e) {
                    if (e.target === overlay) {
                        overlay.classList.remove('open');
                    }
                });
                
                // Close on Escape key
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape' && overlay.classList.contains('open')) {
                        overlay.classList.remove('open');
                    }
                    // Ctrl+Shift+D to toggle
                    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                        e.preventDefault();
                        overlay.classList.toggle('open');
                        if (overlay.classList.contains('open') && searchInput) {
                            searchInput.focus();
                        }
                    }
                });
                
                // Search functionality
                if (searchInput) {
                    searchInput.addEventListener('input', function() {
                        const term = this.value.toLowerCase();
                        document.querySelectorAll('.persona-card').forEach(card => {
                            const name = (card.dataset.name || '').toLowerCase();
                            const title = (card.dataset.title || '').toLowerCase();
                            const dept = (card.dataset.department || '').toLowerCase();
                            
                            const matches = !term || 
                                name.includes(term) || 
                                title.includes(term) || 
                                dept.includes(term);
                            
                            card.style.display = matches ? '' : 'none';
                        });
                    });
                }
                
                // Click persona card to switch
                if (personaGrid) {
                    personaGrid.addEventListener('click', function(e) {
                        const card = e.target.closest('.persona-card');
                        if (card && !card.classList.contains('current')) {
                            const name = card.dataset.name;
                            fetch('/api/persona', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: name })
                            }).then(() => {
                                location.reload();
                            });
                        }
                    });
                }
            })();
            "#
        </script>
    }
}
