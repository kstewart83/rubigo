//! UI Elements - L1 Components
//!
//! Elements are composed from primitives to create more complex
//! reusable components. They are still general-purpose and not
//! tied to specific domain features.
//!
//! ## Components
//!
//! - [`Card`] - Container for grouping related content
//! - [`DataTable`] - Generic data table with column definitions
//! - [`FilterDropdown`] - Dropdown for filtering lists
//! - [`Modal`] - Dialog overlay for focused interactions
//! - [`Pagination`] - Table pagination controls
//! - [`SlidePanel`] - Slide-in panel from right
//! - [`Table`] - Data table with columns and rows
//! - [`Tabs`] - Tabbed navigation interface

pub mod card;
pub mod data_table;
pub mod filter_dropdown;
pub mod modal;
pub mod pagination;
pub mod slide_panel;
pub mod table;
pub mod tabs;

pub use card::{Card, CardVariant};
pub use data_table::{DataColumn, DataRow, DataTable};
pub use filter_dropdown::FilterDropdown;
pub use modal::{Modal, ModalSize};
pub use pagination::Pagination;
pub use slide_panel::{PanelSize, SlidePanel};
pub use table::{Table, TableColumn, TableVariant};
pub use tabs::{TabItem, Tabs, TabsVariant};
