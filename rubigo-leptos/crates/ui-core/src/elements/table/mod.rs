//! Table Component
//!
//! A data table component for displaying structured information.
//!
//! # Usage
//!
//! ```rust
//! use ui_core::elements::{Table, TableColumn};
//!
//! let columns = vec![
//!     TableColumn::new("name", "Name"),
//!     TableColumn::new("role", "Role"),
//!     TableColumn::new("status", "Status"),
//! ];
//!
//! let data: Vec<HashMap<String, String>> = get_data();
//!
//! view! { <Table columns=columns data=data /> }
//! ```
//!
//! # Best Practices
//!
//! - Keep columns to 5-7 for readability
//! - Use sortable columns for large datasets
//! - Provide empty state messaging
//! - Consider pagination for 50+ rows

use leptos::prelude::*;
use std::collections::HashMap;

stylance::import_crate_style!(style, "src/elements/table/table.module.css");

/// Column definition for the table
#[derive(Debug, Clone)]
pub struct TableColumn {
    /// Unique key matching data field
    pub key: String,
    /// Display header text
    pub header: String,
    /// Whether column is sortable
    pub sortable: bool,
    /// Column width (optional CSS value)
    pub width: Option<String>,
}

impl TableColumn {
    /// Create a new column definition
    pub fn new(key: impl Into<String>, header: impl Into<String>) -> Self {
        Self {
            key: key.into(),
            header: header.into(),
            sortable: false,
            width: None,
        }
    }

    /// Make this column sortable
    pub fn sortable(mut self) -> Self {
        self.sortable = true;
        self
    }

    /// Set column width
    pub fn width(mut self, width: impl Into<String>) -> Self {
        self.width = Some(width.into());
        self
    }
}

/// Sort direction
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SortDirection {
    Ascending,
    Descending,
}

/// Table variant
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum TableVariant {
    #[default]
    Default,
    Compact,
    Striped,
}

impl TableVariant {
    fn class(&self) -> &'static str {
        match self {
            TableVariant::Default => "",
            TableVariant::Compact => style::table_compact,
            TableVariant::Striped => style::table_striped,
        }
    }
}

/// Data table component
#[component]
pub fn Table(
    /// Column definitions
    columns: Vec<TableColumn>,
    /// Row data as Vec of HashMaps
    data: Vec<HashMap<String, String>>,
    /// Table variant
    #[prop(default = TableVariant::Default)]
    variant: TableVariant,
    /// Message to show when empty
    #[prop(default = "No data available")]
    empty_message: &'static str,
    /// Callback when row is clicked
    #[prop(optional)]
    on_row_click: Option<Callback<usize>>,
) -> impl IntoView {
    let table_class = format!("{} {}", style::table, variant.class());
    let clickable = on_row_click.is_some();
    let col_count = columns.len();

    // Pre-render headers
    let headers: Vec<_> = columns
        .iter()
        .map(|col| {
            let header = col.header.clone();
            let width_style = col
                .width
                .as_ref()
                .map(|w| format!("width: {}", w))
                .unwrap_or_default();
            let sortable = col.sortable;
            view! {
                <th style=width_style>
                    {header}
                    {sortable.then(|| view! {
                        <span class=style::sort_icon>"↕"</span>
                    })}
                </th>
            }
        })
        .collect();

    // Pre-render rows
    let rows: Vec<_> = if data.is_empty() {
        vec![]
    } else {
        data.iter()
            .enumerate()
            .map(|(idx, row)| {
                let row_class = if clickable { style::row_clickable } else { "" };
                let on_click = on_row_click;
                let cells: Vec<_> = columns
                    .iter()
                    .map(|col| {
                        let value = row.get(&col.key).cloned().unwrap_or_default();
                        view! { <td>{value}</td> }
                    })
                    .collect();
                view! {
                    <tr
                        class=row_class
                        on:click=move |_| {
                            if let Some(callback) = on_click {
                                callback.run(idx);
                            }
                        }
                    >
                        {cells}
                    </tr>
                }
            })
            .collect()
    };

    view! {
        <div class=style::table_wrapper>
            <table class=table_class>
                <thead>
                    <tr>
                        {headers}
                    </tr>
                </thead>
                <tbody>
                    {if data.is_empty() {
                        view! {
                            <tr>
                                <td colspan=col_count.to_string() class=style::empty_state>
                                    {empty_message}
                                </td>
                            </tr>
                        }.into_any()
                    } else {
                        rows.into_any()
                    }}
                </tbody>
            </table>
        </div>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn table_column_builder() {
        let col = TableColumn::new("id", "ID").sortable().width("100px");

        assert_eq!(col.key, "id");
        assert_eq!(col.header, "ID");
        assert!(col.sortable);
        assert_eq!(col.width, Some("100px".to_string()));
    }

    #[test]
    fn table_variant_classes() {
        assert_eq!(TableVariant::Default.class(), "");
        assert!(!TableVariant::Compact.class().is_empty());
        assert!(!TableVariant::Striped.class().is_empty());
    }
}
