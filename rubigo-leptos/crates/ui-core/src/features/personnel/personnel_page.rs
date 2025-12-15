//! Personnel Page Component
//!
//! Main personnel directory page with search, filtering, and employee grid.

use super::employee_card::{Employee, EmployeeCard};
use crate::elements::{PanelSize, SlidePanel};
use leptos::prelude::*;
use leptos_router::hooks::{use_navigate, use_query_map};

stylance::import_crate_style!(style, "src/features/personnel/personnel_page.module.css");

/// View mode for personnel list
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ViewMode {
    Card,
    #[default]
    Table,
}

/// Personnel page component
#[component]
pub fn PersonnelPage(
    /// List of employees
    employees: Vec<Employee>,
    /// Callback when employee is selected (optional external handler)
    #[prop(optional)]
    on_select: Option<Callback<String>>,
) -> impl IntoView {
    // Get query params for initial state
    let query = use_query_map();
    let navigate = use_navigate();

    // Parse view mode from query param
    let initial_view = query
        .get_untracked()
        .get("view")
        .map(|v| {
            if v == "card" {
                ViewMode::Card
            } else {
                ViewMode::Table
            }
        })
        .unwrap_or(ViewMode::Table);

    // State
    let search = RwSignal::new(String::new());
    let department_filter = RwSignal::new(String::new());
    let view_mode = RwSignal::new(initial_view);
    let selected_employee = RwSignal::new(None::<Employee>);
    let show_details = RwSignal::new(false);

    // Pagination state
    let current_page = RwSignal::new(1usize);
    let page_size = RwSignal::new(10usize);

    // Update URL when view mode changes
    Effect::new(move |_| {
        let mode = view_mode.get();
        let view_param = match mode {
            ViewMode::Card => "card",
            ViewMode::Table => "table",
        };
        navigate(
            &format!("/personnel?view={}", view_param),
            Default::default(),
        );
    });

    // Get unique departments
    let departments: Vec<String> = {
        let mut deps: Vec<String> = employees.iter().map(|e| e.department.clone()).collect();
        deps.sort();
        deps.dedup();
        deps
    };

    // Clone for closures
    let employees_for_filter = employees.clone();
    let employees_for_lookup = employees.clone();

    // Filtered employees
    let filtered = move || {
        let search_term = search.get().to_lowercase();
        let dept = department_filter.get();

        employees_for_filter
            .iter()
            .filter(|e| {
                let matches_search = search_term.is_empty()
                    || e.name.to_lowercase().contains(&search_term)
                    || e.title.to_lowercase().contains(&search_term)
                    || e.email.to_lowercase().contains(&search_term);

                let matches_dept = dept.is_empty() || e.department == dept;

                matches_search && matches_dept
            })
            .cloned()
            .collect::<Vec<_>>()
    };

    // Handle employee selection
    let handle_select = move |id: String| {
        if let Some(emp) = employees_for_lookup.iter().find(|e| e.id == id) {
            selected_employee.set(Some(emp.clone()));
            show_details.set(true);
        }
        // Also call external handler if provided
        if let Some(cb) = on_select {
            cb.run(id);
        }
    };
    let select_callback = Callback::new(handle_select);

    let employee_count = employees.len();
    let department_count = departments.len();

    view! {
        <div class=style::personnel_page>
            <div class=style::header>
                <h1 class=style::title>"👥 Personnel"</h1>
                <div class=style::header_actions>
                    <div class=style::stats>
                        <span class=style::stat>{employee_count}" employees"</span>
                        <span class=style::stat>{department_count}" departments"</span>
                    </div>
                    <div class=style::view_toggle>
                        <button
                            class=move || if view_mode.get() == ViewMode::Table {
                                format!("{} {}", style::view_btn, style::view_btn_active)
                            } else {
                                style::view_btn.to_string()
                            }
                            on:click=move |_| view_mode.set(ViewMode::Table)
                        >
                            "☰ Table"
                        </button>
                        <button
                            class=move || if view_mode.get() == ViewMode::Card {
                                format!("{} {}", style::view_btn, style::view_btn_active)
                            } else {
                                style::view_btn.to_string()
                            }
                            on:click=move |_| view_mode.set(ViewMode::Card)
                        >
                            "🎴 Cards"
                        </button>
                    </div>
                </div>
            </div>

            <div class=style::filters>
                <input
                    type="text"
                    placeholder="Search by name, title, or email..."
                    class=style::search_input
                    on:input=move |ev| search.set(event_target_value(&ev))
                />
                <select
                    class=style::department_select
                    on:change=move |ev| department_filter.set(event_target_value(&ev))
                >
                    <option value="">"All Departments"</option>
                    {departments.iter().map(|dept| {
                        let value = dept.clone();
                        let text = dept.clone();
                        view! { <option value=value>{text}</option> }
                    }).collect::<Vec<_>>()}
                </select>
            </div>

            {move || match view_mode.get() {
                ViewMode::Card => view! {
                    <div class=style::grid>
                        {filtered().into_iter().map(|emp| {
                            view! { <EmployeeCard employee=emp on_click=select_callback /> }
                        }).collect::<Vec<_>>()}
                    </div>
                }.into_any(),
                ViewMode::Table => {
                    // Calculate pagination values
                    let all_items = filtered();
                    let total_items = all_items.len();
                    let size = page_size.get();
                    let total_pages = if total_items == 0 { 1 } else { (total_items + size - 1) / size };
                    let page = current_page.get().min(total_pages);
                    let start = (page - 1) * size;
                    let end = (start + size).min(total_items);
                    let paginated: Vec<Employee> = all_items.into_iter().skip(start).take(size).collect();

                    let show_start = if total_items == 0 { 0 } else { start + 1 };
                    let is_first = page <= 1;
                    let is_last = page >= total_pages;

                    view! {
                        <div class=style::table_container>
                            <table class=style::table>
                                <thead>
                                    <tr>
                                        <th>"Name"</th>
                                        <th>"Title"</th>
                                        <th>"Department"</th>
                                        <th>"Email"</th>
                                        <th>"Location"</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.into_iter().map(|emp| {
                                        let emp_id = emp.id.clone();
                                        let location = emp.building.clone().unwrap_or_else(|| "Remote".to_string());
                                        let photo_url = emp.photo_url.clone().unwrap_or_default();
                                        view! {
                                            <tr
                                                class=style::table_row
                                                on:click=move |_| {
                                                    select_callback.run(emp_id.clone());
                                                }
                                            >
                                                <td class=style::name_cell>
                                                    <img src=photo_url class=style::table_avatar />
                                                    {emp.name}
                                                </td>
                                                <td>{emp.title}</td>
                                                <td>{emp.department}</td>
                                                <td class=style::email_cell>{emp.email}</td>
                                                <td>{location}</td>
                                            </tr>
                                        }
                                    }).collect::<Vec<_>>()}
                                </tbody>
                            </table>
                            <div class=style::pagination>
                                <span class=style::pagination_info>
                                    {format!("Showing {}-{} of {}", show_start, end, total_items)}
                                </span>
                                <div class=style::pagination_controls>
                                    <button
                                        class=style::pagination_btn
                                        disabled=is_first
                                        on:click=move |_| current_page.update(|p| *p = (*p).saturating_sub(1).max(1))
                                    >
                                        "← Prev"
                                    </button>
                                    <span class=style::pagination_pages>
                                        {format!("Page {} of {}", page, total_pages)}
                                    </span>
                                    <button
                                        class=style::pagination_btn
                                        disabled=is_last
                                        on:click=move |_| current_page.update(|p| *p += 1)
                                    >
                                        "Next →"
                                    </button>
                                </div>
                                <select
                                    class=style::page_size_select
                                    on:change=move |ev| {
                                        let val: usize = event_target_value(&ev).parse().unwrap_or(10);
                                        page_size.set(val);
                                        current_page.set(1);
                                    }
                                >
                                    <option value="5">"5 per page"</option>
                                    <option value="10" selected=true>"10 per page"</option>
                                    <option value="25">"25 per page"</option>
                                    <option value="50">"50 per page"</option>
                                </select>
                            </div>
                        </div>
                    }.into_any()
                },
            }}

            // Employee Details SlidePanel
            <SlidePanel
                open=show_details
                title="Employee Details"
                size=PanelSize::Medium
            >
                {move || selected_employee.get().map(|emp| {
                    let photo_url = emp.photo_url.clone();
                    let has_photo = photo_url.is_some();
                    let initials = emp.initials();

                    view! {
                    <div class=style::detail_content>
                        <div class=style::detail_header>
                            {if has_photo {
                                view! {
                                    <img
                                        src=photo_url.unwrap_or_default()
                                        class=style::detail_photo
                                    />
                                }.into_any()
                            } else {
                                view! {
                                    <div class=style::detail_avatar>
                                        {initials}
                                    </div>
                                }.into_any()
                            }}
                            <div>
                                <h3 class=style::detail_name>{emp.name.clone()}</h3>
                                <p class=style::detail_title>{emp.title.clone()}</p>
                            </div>
                        </div>

                        <div class=style::detail_section>
                            <h4>"Contact"</h4>
                            <p><strong>"Email: "</strong>{emp.email.clone()}</p>
                            {emp.phone.clone().map(|p| view! { <p><strong>"Phone: "</strong>{p}</p> })}
                        </div>

                        <div class=style::detail_section>
                            <h4>"Organization"</h4>
                            <p><strong>"Department: "</strong>{emp.department.clone()}</p>
                        </div>

                        <div class=style::detail_section>
                            <h4>"Location"</h4>
                            <p>{emp.location()}</p>
                        </div>

                        {emp.bio.clone().map(|bio| view! {
                            <div class=style::detail_section>
                                <h4>"Bio"</h4>
                                <p>{bio}</p>
                            </div>
                        })}
                    </div>
                    }
                })}
            </SlidePanel>
        </div>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_employees_list() {
        let employees: Vec<Employee> = vec![];
        assert!(employees.is_empty());
    }
}
