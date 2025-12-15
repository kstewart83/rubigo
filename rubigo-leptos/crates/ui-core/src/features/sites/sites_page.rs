//! Sites Page Component
//!
//! Main page for site visualization with 3D globe.

use leptos::prelude::*;

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/features/sites/sites.module.css"
);

/// Sites page with 3D globe visualization
#[component]
pub fn SitesPage() -> impl IntoView {
    view! {
        <div class=style::sites_page>
            <div class=style::sites_header>
                <h1>"Sites"</h1>
                <p class=style::sites_subtitle>"Global site locations and infrastructure"</p>
            </div>

            <div class=style::globe_container>
                // Canvas for Bevy rendering
                <canvas id="bevy_canvas" class=style::globe_canvas></canvas>
                <div class=style::globe_loading>
                    <span class=style::loading_spinner></span>
                    <p>"Initializing 3D viewer..."</p>
                </div>
            </div>

            <div class=style::sites_info>
                <p>"🌍 Interactive 3D globe visualization"</p>
                <p class=style::info_hint>"Drag to rotate • Scroll to zoom"</p>
            </div>
        </div>
    }
}
