//! Modal Component
//!
//! A dialog overlay for focused user interactions.
//!
//! # Usage
//!
//! ```rust
//! use ui_core::elements::Modal;
//!
//! let show = RwSignal::new(false);
//!
//! view! {
//!     <Button on_click=move |_| show.set(true)>"Open Modal"</Button>
//!     <Modal
//!         open=show
//!         title="Confirm Action"
//!     >
//!         <p>"Are you sure you want to proceed?"</p>
//!     </Modal>
//! }
//! ```
//!
//! # Best Practices
//!
//! - Use modals sparingly for important interactions
//! - Provide clear title and action buttons
//! - Always include a way to close (X button, backdrop click)
//! - Keep modal content focused and concise

use leptos::prelude::*;

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/elements/modal/modal.module.css"
);

/// Modal size variants
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum ModalSize {
    Small,
    #[default]
    Medium,
    Large,
    FullScreen,
}

impl ModalSize {
    fn class(&self) -> &'static str {
        match self {
            ModalSize::Small => style::modal_sm,
            ModalSize::Medium => "",
            ModalSize::Large => style::modal_lg,
            ModalSize::FullScreen => style::modal_fullscreen,
        }
    }
}

/// Modal dialog component
#[component]
pub fn Modal(
    /// Whether the modal is open (reactive signal)
    open: RwSignal<bool>,
    /// Modal title
    #[prop(optional, into)]
    title: Option<String>,
    /// Size variant
    #[prop(default = ModalSize::Medium)]
    size: ModalSize,
    /// Main content
    children: ChildrenFn,
) -> impl IntoView {
    let modal_class = format!("{} {}", style::modal, size.class());
    let title_el = title.map(|t| view! { <h2 class=style::modal_title>{t}</h2> });

    let close = move |_| open.set(false);

    // Listen for Escape key to close modal
    Effect::new(move |_| {
        use wasm_bindgen::prelude::*;
        use wasm_bindgen::JsCast;

        if open.get() {
            let callback =
                Closure::<dyn Fn(web_sys::KeyboardEvent)>::new(move |e: web_sys::KeyboardEvent| {
                    if e.key() == "Escape" {
                        open.set(false);
                    }
                });

            if let Some(window) = web_sys::window() {
                let _ = window
                    .add_event_listener_with_callback("keydown", callback.as_ref().unchecked_ref());
                callback.forget();
            }
        }
    });

    view! {
        {move || open.get().then(|| view! {
            <div class=style::modal_backdrop on:click=close>
                <div
                    class=modal_class.clone()
                    on:click=|e| e.stop_propagation()
                >
                    <div class=style::modal_header>
                        {title_el.clone()}
                        <button class=style::modal_close on:click=close>
                            "✕"
                        </button>
                    </div>
                    <div class=style::modal_content>
                        {children()}
                    </div>
                </div>
            </div>
        })}
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn modal_size_classes() {
        assert!(!ModalSize::Small.class().is_empty());
        assert_eq!(ModalSize::Medium.class(), "");
        assert!(!ModalSize::Large.class().is_empty());
        assert!(!ModalSize::FullScreen.class().is_empty());
    }

    #[test]
    fn modal_size_default() {
        assert_eq!(ModalSize::default(), ModalSize::Medium);
    }
}
