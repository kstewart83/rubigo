//! Data Table Component
//!
//! Generic clickable table with column definitions and row data.

use leptos::prelude::*;
use std::collections::HashMap;

stylance::import_crate_style!(style, "src/elements/data_table/data_table.module.css");

/// Column definition
#[derive(Debug, Clone)]
pub struct DataColumn {
    /// Unique key for this column (used to match row data)
    pub key: String,
    /// Display header text
    pub header: String,
    /// Optional width (e.g. "200px", "30%")
    pub width: Option<String>,
}

impl DataColumn {
    pub fn new(key: impl Into<String>, header: impl Into<String>) -> Self {
        Self {
            key: key.into(),
            header: header.into(),
            width: None,
        }
    }

    pub fn with_width(mut self, width: impl Into<String>) -> Self {
        self.width = Some(width.into());
        self
    }
}

/// Row data with ID and cell values
#[derive(Debug, Clone)]
pub struct DataRow {
    /// Unique identifier for this row
    pub id: String,
    /// Cell values keyed by column key
    pub cells: HashMap<String, String>,
}

impl DataRow {
    pub fn new(id: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            cells: HashMap::new(),
        }
    }

    pub fn cell(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.cells.insert(key.into(), value.into());
        self
    }
}

/// Data table component
#[component]
pub fn DataTable(
    /// Column definitions
    columns: Vec<DataColumn>,
    /// Row data
    rows: Vec<DataRow>,
    /// Callback when row is clicked (receives row ID)
    #[prop(optional)]
    on_row_click: Option<Callback<String>>,
) -> impl IntoView {
    view! {
        <div class=style::table_container>
            <table class=style::table>
                <thead>
                    <tr>
                        {columns.iter().map(|col| {
                            let header = col.header.clone();
                            let style_attr = col.width.as_ref().map(|w| format!("width: {}", w));
                            view! {
                                <th style=style_attr>{header}</th>
                            }
                        }).collect::<Vec<_>>()}
                    </tr>
                </thead>
                <tbody>
                    {rows.into_iter().map(|row| {
                        let row_id = row.id.clone();
                        let row_id_click = row_id.clone();
                        let cells = row.cells;
                        let cols = columns.clone();

                        view! {
                            <tr
                                class=style::table_row
                                on:click=move |_| {
                                    if let Some(cb) = on_row_click {
                                        cb.run(row_id_click.clone());
                                    }
                                }
                            >
                                {cols.iter().map(|col| {
                                    let value = cells.get(&col.key).cloned().unwrap_or_default();
                                    view! { <td>{value}</td> }
                                }).collect::<Vec<_>>()}
                            </tr>
                        }
                    }).collect::<Vec<_>>()}
                </tbody>
            </table>
        </div>
    }
}
