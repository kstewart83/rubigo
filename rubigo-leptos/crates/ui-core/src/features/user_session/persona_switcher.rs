//! Persona Switcher Component
//!
//! Overlay dialog for selecting user identity during development.

use super::UserInfo;
use leptos::prelude::*;
use wasm_bindgen::JsCast;

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/features/user_session/user_session.module.css"
);

/// Persona switcher overlay with search and selection
#[component]
pub fn PersonaSwitcher(
    /// Whether the overlay is open
    open: RwSignal<bool>,
    /// Available people to select from
    people: Vec<UserInfo>,
    /// Current user (if any)
    current_user: Option<UserInfo>,
    /// Callback when a persona is selected
    on_select: Callback<UserInfo>,
) -> impl IntoView {
    let search_term = RwSignal::new(String::new());
    let people_list = people.clone();

    // Clone current_user data for different closures
    let current_user_for_display = current_user.clone();
    let current_user_id = current_user.as_ref().map(|u| u.id.clone());

    let close_overlay = move |_: web_sys::MouseEvent| {
        open.set(false);
        search_term.set(String::new());
    };

    // Filter people based on search
    let filtered_people = move || {
        let term = search_term.get().to_lowercase();
        if term.is_empty() {
            people_list.clone()
        } else {
            people_list
                .iter()
                .filter(|p| {
                    p.name.to_lowercase().contains(&term)
                        || p.title
                            .as_ref()
                            .map(|t| t.to_lowercase().contains(&term))
                            .unwrap_or(false)
                        || p.department
                            .as_ref()
                            .map(|d| d.to_lowercase().contains(&term))
                            .unwrap_or(false)
                })
                .cloned()
                .collect()
        }
    };

    let overlay_class = move || {
        if open.get() {
            format!("{} dev-overlay open", style::dev_overlay)
        } else {
            format!("{} dev-overlay", style::dev_overlay)
        }
    };

    view! {
        <div id="dev-overlay" class=overlay_class on:click=move |e: web_sys::MouseEvent| {
            // Close on backdrop click
            if let Some(target) = e.target() {
                if let Some(el) = target.dyn_ref::<web_sys::Element>() {
                    if el.class_list().contains("dev-overlay") {
                        open.set(false);
                        search_term.set(String::new());
                    }
                }
            }
        }>
            <div class=style::dev_overlay_content>
                <div class=style::dev_overlay_header>
                    <h2>"Select Identity"</h2>
                    <button id="dev-overlay-close" class=style::dev_overlay_close on:click=close_overlay>
                        "×"
                    </button>
                </div>

                <div class=style::dev_overlay_section>
                    {current_user_for_display.map(|u| view! {
                        <p class=style::dev_overlay_current>
                            "Currently viewing as: "
                            <strong>{u.name.clone()}</strong>
                        </p>
                    })}

                    <input
                        type="text"
                        id="persona-search"
                        class=format!("{} persona-search", style::persona_search)
                        placeholder="Search by name, title, or department..."
                        prop:value=move || search_term.get()
                        on:input=move |ev| {
                            search_term.set(event_target_value(&ev));
                        }
                    />

                    <div id="persona-grid" class=format!("{} persona-grid", style::persona_grid)>
                        {move || {
                            let current_id = current_user_id.clone();
                            filtered_people().into_iter().map(|person| {
                                let is_current = current_id.as_ref().map(|id| id == &person.id).unwrap_or(false);
                                let card_class = if is_current {
                                    format!("{} persona-card current", style::persona_card)
                                } else {
                                    format!("{} persona-card", style::persona_card)
                                };

                                let person_for_click = person.clone();
                                let name = person.name.clone();
                                let title = person.title.clone().unwrap_or_default();
                                let department = person.department.clone().unwrap_or_default();
                                let initials = person.initials();

                                // Clone for display inside the view
                                let display_name = name.clone();
                                let display_title = title.clone();
                                let display_dept = department.clone();

                                view! {
                                    <div
                                        class=card_class
                                        data-name=name
                                        data-title=title
                                        data-department=department
                                        on:click=move |_| {
                                            if !is_current {
                                                on_select.run(person_for_click.clone());
                                                open.set(false);
                                                search_term.set(String::new());
                                            }
                                        }
                                    >
                                        <div class=format!("{} persona-avatar", style::persona_avatar)>
                                            <span class=style::avatar_initials>{initials}</span>
                                        </div>
                                        <div class=format!("{} persona-info", style::persona_info)>
                                            <div class=format!("{} persona-name", style::persona_name)>{display_name}</div>
                                            <div class=format!("{} persona-title", style::persona_title)>{display_title}</div>
                                            <div class=format!("{} persona-dept", style::persona_dept)>{display_dept}</div>
                                        </div>
                                        {if is_current {
                                            view! { <span class=format!("{} persona-current-badge", style::persona_current_badge)>"Current"</span> }.into_any()
                                        } else {
                                            view! { <span></span> }.into_any()
                                        }}
                                    </div>
                                }
                            }).collect::<Vec<_>>()
                        }}
                    </div>
                </div>
            </div>
        </div>
    }
}
