//! Personnel Feature Module
//!
//! Employee directory with search, filtering, and detail cards.
//!
//! This module provides components for displaying personnel information
//! using the new ui-core component architecture.

pub mod employee_card;
pub mod personnel_page;

pub use employee_card::{Employee, EmployeeCard};
pub use personnel_page::PersonnelPage;
