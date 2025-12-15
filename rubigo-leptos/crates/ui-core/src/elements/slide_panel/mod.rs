//! SlidePanel Component
//!
//! A slide-in panel from the right side of the screen.
//! Used for details views, forms, and focused content.
//!
//! # Usage
//!
//! ```rust,ignore
//! use ui_core::elements::SlidePanel;
//!
//! let show = RwSignal::new(false);
//!
//! view! {
//!     <Button on_click=move |_| show.set(true)>"View Details"</Button>
//!     <SlidePanel
//!         open=show
//!         title="Employee Details"
//!     >
//!         <p>"Panel content here"</p>
//!     </SlidePanel>
//! }
//! ```

use leptos::prelude::*;

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/elements/slide_panel/slide_panel.module.css"
);

/// Panel size variants
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum PanelSize {
    Small,
    #[default]
    Medium,
    Large,
    XLarge,
}

impl PanelSize {
    fn class(&self) -> &'static str {
        match self {
            PanelSize::Small => style::panel_sm,
            PanelSize::Medium => "",
            PanelSize::Large => style::panel_lg,
            PanelSize::XLarge => style::panel_xl,
        }
    }
}

/// Slide-in panel component
#[component]
pub fn SlidePanel(
    /// Whether the panel is open (reactive signal)
    open: RwSignal<bool>,
    /// Panel title
    #[prop(optional, into)]
    title: Option<String>,
    /// Size variant
    #[prop(default = PanelSize::Medium)]
    size: PanelSize,
    /// Main content - use ChildrenFn for reactive rendering
    children: ChildrenFn,
) -> impl IntoView {
    let panel_class = format!("{} {}", style::panel, size.class());

    let close = move |_| open.set(false);

    // Listen for Escape key to close panel
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
                // Keep the closure alive
                callback.forget();
            }
        }
    });

    view! {
        {move || open.get().then(|| view! {
            <div class=style::panel_backdrop on:click=close>
                <div
                    class=panel_class.clone()
                    on:click=|e| e.stop_propagation()
                >
                    <div class=style::panel_header>
                        {title.clone().map(|t| view! { <h2 class=style::panel_title>{t}</h2> })}
                        <button class=style::panel_close on:click=close>
                            "✕"
                        </button>
                    </div>
                    <div class=style::panel_content>
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
    fn panel_size_classes() {
        assert!(!PanelSize::Small.class().is_empty());
        assert_eq!(PanelSize::Medium.class(), "");
        assert!(!PanelSize::Large.class().is_empty());
        assert!(!PanelSize::XLarge.class().is_empty());
    }

    #[test]
    fn panel_size_default() {
        assert_eq!(PanelSize::default(), PanelSize::Medium);
    }
}
