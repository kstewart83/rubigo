use leptos::*;
use nexosim_hybrid::config::{ComponentConfig, ConnectionConfig as BaseConnectionConfig};

#[component]
pub fn ConnectionManager(
    connections: Vec<BaseConnectionConfig>,
    components: Vec<ComponentConfig>,
) -> impl IntoView {
    let comp_source = components.clone();
    let comp_dest = components.clone();

    view! {
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3>"Connection Manager"</h3>
                <span class="badge" style="background: var(--bg-dark); padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; color: var(--text-secondary);">
                    {format!("Total: {}", connections.len())}
                </span>
            </div>

            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>"From (Source)"</th>
                            <th>"To (Dest)"</th>
                            <th style="text-align: right;">"Actions"</th>
                        </tr>
                    </thead>
                    <tbody>
                        <For
                            each=move || connections.clone()
                            key=|c| format!("{}-{}", c.from, c.to)
                            children=move |c| {
                                view! {
                                    <tr>
                                        <td><code style="color: var(--text-accent);">{c.from}</code></td>
                                        <td><code style="color: var(--text-accent);">{c.to}</code></td>
                                        <td style="text-align: right;">
                                            <form action={format!("/actions/connections/delete/{}/{}", c.from, c.to)} method="post" style="display: inline;">
                                                <button class="danger" type="submit" style="padding: 0.5rem 1rem;">"Unlink"</button>
                                            </form>
                                        </td>
                                    </tr>
                                }
                            }
                        />
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border);">
                <h4 style="margin-bottom: 1rem;">"Add Connection"</h4>
                <form action="/actions/connections/create" method="post" class="add-component-form">
                    <div style="display: flex; flex-direction: column;">
                        <label style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">"Source Component"</label>
                        <select name="from" required>
                            <For
                                each=move || comp_source.clone()
                                key=|c| c.id
                                children=move |c| {
                                    view! { <option value={c.id}>{format!("{} ({})", c.name, c.id)}</option> }
                                }
                            />
                        </select>
                    </div>

                    <div style="display: flex; flex-direction: column;">
                        <label style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">"Destination Component"</label>
                        <select name="to" required>
                             <For
                                each=move || comp_dest.clone()
                                key=|c| c.id
                                children=move |c| {
                                    view! { <option value={c.id}>{format!("{} ({})", c.name, c.id)}</option> }
                                }
                            />
                        </select>
                    </div>

                    <button type="submit" style="height: fit-content; align-self: flex-end;">"Link Components"</button>
                </form>
            </div>
        </div>
    }
}
