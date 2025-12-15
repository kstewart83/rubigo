use leptos::prelude::*;

#[component]
pub fn MetricsTab() -> impl IntoView {
    view! {
        <div class="card">
            <h2>"System Metrics"</h2>
            <p class="text-muted">"Metrics will appear here after running a simulation."</p>
        </div>
    }
}
