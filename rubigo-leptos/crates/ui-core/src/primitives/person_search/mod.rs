//! Person Search Multi-Select Component
//!
//! A searchable dropdown for selecting multiple people from a list.

use leptos::prelude::*;

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/primitives/person_search/person_search.module.css"
);

/// A person option for selection
#[derive(Debug, Clone, PartialEq)]
pub struct PersonOption {
    pub id: String,
    pub name: String,
    pub title: Option<String>,
    pub photo_url: Option<String>,
}

impl PersonOption {
    pub fn new(id: impl Into<String>, name: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            title: None,
            photo_url: None,
        }
    }

    pub fn with_title(mut self, title: impl Into<String>) -> Self {
        self.title = Some(title.into());
        self
    }
}

/// Multi-select person search input
#[component]
pub fn PersonSearch(
    /// Label for the input
    #[prop(optional, into)]
    label: Option<String>,
    /// Selected person IDs
    selected: RwSignal<Vec<String>>,
    /// All available people to search from
    #[prop(into)]
    people: Vec<PersonOption>,
    /// Placeholder text
    #[prop(default = "Search people...")]
    placeholder: &'static str,
    /// Callback when selection changes
    #[prop(optional)]
    on_change: Option<Callback<Vec<String>>>,
) -> impl IntoView {
    let search_query = RwSignal::new(String::new());
    let dropdown_open = RwSignal::new(false);
    let people_clone = people.clone();

    // Filter people based on search query
    let filtered_people = Memo::new(move |_| {
        let query = search_query.get().to_lowercase();
        if query.is_empty() {
            people_clone.clone()
        } else {
            people_clone
                .iter()
                .filter(|p| p.name.to_lowercase().contains(&query))
                .cloned()
                .collect()
        }
    });

    // Get selected people info
    let people_for_selected = people.clone();
    let selected_people = Memo::new(move |_| {
        let sel_ids = selected.get();
        people_for_selected
            .iter()
            .filter(|p| sel_ids.contains(&p.id))
            .cloned()
            .collect::<Vec<_>>()
    });

    let handle_select = move |person_id: String| {
        selected.update(|ids| {
            if !ids.contains(&person_id) {
                ids.push(person_id);
            }
        });
        search_query.set(String::new());
        dropdown_open.set(false);
        if let Some(cb) = on_change {
            cb.run(selected.get());
        }
    };

    let handle_remove = move |person_id: String| {
        selected.update(|ids| {
            ids.retain(|id| id != &person_id);
        });
        if let Some(cb) = on_change {
            cb.run(selected.get());
        }
    };

    let handle_input = move |ev: web_sys::Event| {
        let value = event_target_value(&ev);
        search_query.set(value);
        dropdown_open.set(true);
    };

    let handle_focus = move |_| {
        dropdown_open.set(true);
    };

    view! {
        <div class=style::person_search_wrapper>
            {label.map(|l| view! { <label class=style::person_search_label>{l}</label> })}

            // Selected people chips
            <div class=style::selected_chips>
                {move || {
                    selected_people.get().into_iter().map(|person| {
                        let id = person.id.clone();
                        let id_for_remove = id.clone();
                        view! {
                            <div class=style::person_chip>
                                <span class=style::chip_name>{person.name}</span>
                                <button
                                    type="button"
                                    class=style::chip_remove
                                    on:click=move |_| handle_remove(id_for_remove.clone())
                                >
                                    "×"
                                </button>
                            </div>
                        }
                    }).collect::<Vec<_>>()
                }}
            </div>

            // Search input
            <div class=style::search_container>
                <input
                    type="text"
                    class=style::search_input
                    placeholder=placeholder
                    prop:value=move || search_query.get()
                    on:input=handle_input
                    on:focus=handle_focus
                />

                // Dropdown
                {move || {
                    if dropdown_open.get() {
                        let people_list = filtered_people.get();
                        let selected_ids = selected.get();

                        // Filter out already selected
                        let available: Vec<_> = people_list
                            .into_iter()
                            .filter(|p| !selected_ids.contains(&p.id))
                            .collect();

                        if available.is_empty() {
                            view! {
                                <div class=style::dropdown>
                                    <div class=style::dropdown_empty>"No people found"</div>
                                </div>
                            }.into_any()
                        } else {
                            view! {
                                <div class=style::dropdown>
                                    {available.into_iter().map(|person| {
                                        let id = person.id.clone();
                                        let name = person.name.clone();
                                        let title = person.title.clone();

                                        view! {
                                            <div
                                                class=style::dropdown_item
                                                on:click=move |_| handle_select(id.clone())
                                            >
                                                <div class=style::person_avatar>
                                                    {name.chars().next().unwrap_or('?').to_string()}
                                                </div>
                                                <div class=style::person_info>
                                                    <span class=style::person_name>{name}</span>
                                                    {title.map(|t| view! {
                                                        <span class=style::person_title>{t}</span>
                                                    })}
                                                </div>
                                            </div>
                                        }
                                    }).collect::<Vec<_>>()}
                                </div>
                            }.into_any()
                        }
                    } else {
                        view! { <></> }.into_any()
                    }
                }}
            </div>
        </div>
    }
}
