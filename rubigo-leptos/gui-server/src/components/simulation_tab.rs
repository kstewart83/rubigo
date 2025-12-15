use crate::SimulationRun;
use leptos::prelude::*;

#[component]
pub fn SimulationTab(runs: Vec<SimulationRun>) -> impl IntoView {
    view! {
        <div class="card">
            <h2>"Simulation"</h2>

            <form action="/simulation/start" method="post">
                <button type="submit" class="btn btn-primary">"Start Simulation"</button>
            </form>

            <h3>"Previous Runs"</h3>
            {if runs.is_empty() {
                view! { <p class="text-muted">"No simulation runs yet. Click 'Start Simulation' to create one."</p> }.into_any()
            } else {
                view! {
                    <div class="runs-list">
                        {runs.into_iter().map(|r| {
                            let id = r.id.as_ref().map(|t| t.id.to_string()).unwrap_or_default();
                            let delete_url = format!("/runs/{}/delete", id);
                            let log_count = r.logs.len();
                            view! {
                                <div class="card" style="margin-bottom: 16px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                        <div>
                                            <strong>{r.started_at.clone()}</strong>
                                            <span class="text-muted" style="margin-left: 12px;">{format!("Status: {}", r.status)}</span>
                                        </div>
                                        <form action=delete_url method="post" style="display:inline;">
                                            <button type="submit" class="btn btn-danger btn-sm">"Delete"</button>
                                        </form>
                                    </div>
                                    <details>
                                        <summary style="cursor: pointer; color: var(--color-primary);">
                                            {format!("View Logs ({} entries)", log_count)}
                                        </summary>
                                        <div class="log-output" style="margin-top: 12px; padding: 12px; background: var(--bg-body); border-radius: 8px; font-family: var(--font-mono); font-size: 13px; overflow-x: auto;">
                                            {r.logs.into_iter().map(|log| {
                                                view! { <div style="padding: 4px 0; color: var(--text-secondary);">{log}</div> }
                                            }).collect_view()}
                                        </div>
                                    </details>
                                </div>
                            }
                        }).collect_view()}
                    </div>
                }.into_any()
            }}
        </div>
    }
}
