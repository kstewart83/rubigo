//! Pagination Component
//!
//! Table pagination controls with prev/next and page size selector.

use leptos::prelude::*;

stylance::import_crate_style!(style, "src/elements/pagination/pagination.module.css");

/// Page size options
pub const PAGE_SIZE_OPTIONS: &[usize] = &[5, 10, 25, 50];

/// Pagination component
#[component]
pub fn Pagination(
    /// Current page (1-indexed)
    current_page: RwSignal<usize>,
    /// Items per page
    page_size: RwSignal<usize>,
    /// Total number of items
    #[prop(into)]
    total_items: Signal<usize>,
) -> impl IntoView {
    // Derived values
    let total_pages = move || {
        let items = total_items.get();
        let size = page_size.get();
        if items == 0 {
            1
        } else {
            (items + size - 1) / size
        }
    };

    let page_info = move || {
        let items = total_items.get();
        let size = page_size.get();
        let page = current_page.get().min(total_pages());
        let start = if items == 0 { 0 } else { (page - 1) * size + 1 };
        let end = (page * size).min(items);
        format!("Showing {}-{} of {}", start, end, items)
    };

    let page_display = move || {
        format!(
            "Page {} of {}",
            current_page.get().min(total_pages()),
            total_pages()
        )
    };

    let is_first = move || current_page.get() <= 1;
    let is_last = move || current_page.get() >= total_pages();

    view! {
        <div class=style::pagination>
            <span class=style::pagination_info>
                {page_info}
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
                    {page_display}
                </span>
                <button
                    class=style::pagination_btn
                    disabled=is_last
                    on:click=move |_| {
                        let max = total_pages();
                        current_page.update(|p| *p = (*p + 1).min(max))
                    }
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
                {PAGE_SIZE_OPTIONS.iter().map(|&size| {
                    let selected = page_size.get_untracked() == size;
                    view! {
                        <option value=size.to_string() selected=selected>
                            {format!("{} per page", size)}
                        </option>
                    }
                }).collect::<Vec<_>>()}
            </select>
        </div>
    }
}
