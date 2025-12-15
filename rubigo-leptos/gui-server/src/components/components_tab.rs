use crate::ComponentConfig;
use leptos::prelude::*;

#[component]
pub fn ComponentsTab(components: Vec<ComponentConfig>) -> impl IntoView {
    view! {
        <div class="card">
            <h2>"Components"</h2>

            <form action="/components/create" method="post" class="form-inline">
                <input type="text" name="id" placeholder="ID (optional)" style="width: 100px;"/>
                <input type="text" name="name" placeholder="Component name" required/>
                <select name="component_type">
                    <option value="router">"Router"</option>
                    <option value="switch">"Switch"</option>
                </select>
                <button type="submit" class="btn btn-primary">"Add Component"</button>
            </form>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>"ID"</th>
                        <th>"Name"</th>
                        <th>"Type"</th>
                        <th>"Actions"</th>
                    </tr>
                </thead>
                <tbody>
                    {components.into_iter().map(|c| {
                        let type_str = format!("{:?}", c.component_type);
                        let delete_url = format!("/components/{}/delete", c.id);
                        view! {
                            <tr>
                                <td>{c.id}</td>
                                <td>{c.name}</td>
                                <td>{type_str}</td>
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
