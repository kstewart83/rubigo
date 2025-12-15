use leptos::prelude::*;
use crate::{ConnectionConfig, ComponentConfig};

#[component]
pub fn ConnectionsTab(connections: Vec<ConnectionConfig>, components: Vec<ComponentConfig>) -> impl IntoView {
    view! {
        <div class="card">
            <h2>"Connections"</h2>
            
            <form action="/connections/create" method="post" class="form-inline">
                <select name="from_id">
                    {components.iter().map(|c| {
                        let val = c.id.to_string();
                        let label = format!("{} ({})", c.name, c.id);
                        view! { <option value=val>{label}</option> }
                    }).collect_view()}
                </select>
                <span>" → "</span>
                <select name="to_id">
                    {components.iter().map(|c| {
                        let val = c.id.to_string();
                        let label = format!("{} ({})", c.name, c.id);
                        view! { <option value=val>{label}</option> }
                    }).collect_view()}
                </select>
                <button type="submit" class="btn btn-primary">"Add Connection"</button>
            </form>
            
            <table class="data-table">
                <thead>
                    <tr>
                        <th>"From"</th>
                        <th>"To"</th>
                        <th>"Actions"</th>
                    </tr>
                </thead>
                <tbody>
                    {connections.into_iter().map(|c| {
                        let delete_url = format!("/connections/{}/{}/delete", c.from, c.to);
                        view! {
                            <tr>
                                <td>{c.from}</td>
                                <td>{c.to}</td>
                                <td>
                                    <form action=delete_url method="post" style="display:inline;">
                                        <button type="submit" class="btn btn-danger btn-sm">"Delete"</button>
                                    </form>
                                </td>
                            </tr>
                        }
                    }).collect_view()}
                </tbody>
            </table>
        </div>
    }
}
