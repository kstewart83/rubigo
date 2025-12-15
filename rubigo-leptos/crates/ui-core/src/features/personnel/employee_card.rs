//! Employee Card Component
//!
//! Displays a single employee with avatar, name, title, and contact info.

use leptos::prelude::*;

stylance::import_crate_style!(
    #[allow(dead_code)]
    style,
    "src/features/personnel/employee_card.module.css"
);

/// Employee data for display
#[derive(Debug, Clone)]
pub struct Employee {
    pub id: String,
    pub name: String,
    pub title: String,
    pub department: String,
    pub email: String,
    pub building: Option<String>,
    pub floor: Option<String>,
    pub desk: Option<String>,
    pub phone: Option<String>,
    pub photo_url: Option<String>,
    pub bio: Option<String>,
}

impl Employee {
    /// Get initials for avatar
    pub fn initials(&self) -> String {
        self.name
            .split_whitespace()
            .filter_map(|w| w.chars().next())
            .take(2)
            .collect()
    }

    /// Format location string
    pub fn location(&self) -> String {
        match (&self.building, &self.floor, &self.desk) {
            (Some(b), Some(f), Some(d)) => format!("{}, {}, {}", b, f, d),
            (Some(b), Some(f), None) => format!("{}, {}", b, f),
            (Some(b), None, None) => b.clone(),
            _ => "Remote / Unassigned".to_string(),
        }
    }
}

/// Employee card showing summary info
#[component]
pub fn EmployeeCard(
    /// Employee data
    employee: Employee,
    /// Callback when card is clicked
    #[prop(optional)]
    on_click: Option<Callback<String>>,
) -> impl IntoView {
    let id = employee.id.clone();
    let initials = employee.initials();

    let has_photo = employee.photo_url.is_some();
    let photo_style = employee
        .photo_url
        .clone()
        .map(|url| format!("background-image: url('{}')", url))
        .unwrap_or_default();

    let card_class = if on_click.is_some() {
        format!("{} {}", style::employee_card, style::clickable)
    } else {
        style::employee_card.to_string()
    };

    let avatar_class = if has_photo {
        format!("{} {}", style::avatar, style::has_photo)
    } else {
        style::avatar.to_string()
    };

    view! {
        <div
            class=card_class
            on:click=move |_| {
                if let Some(callback) = on_click {
                    callback.run(id.clone());
                }
            }
        >
            <div class=avatar_class style=photo_style>
                <span class=style::initials>{initials}</span>
            </div>
            <div class=style::info>
                <h3 class=style::name>{employee.name.clone()}</h3>
                <p class=style::title>{employee.title.clone()}</p>
                <p class=style::department>{employee.department.clone()}</p>
            </div>
            <a
                href=format!("mailto:{}", employee.email)
                class=style::email_icon
                on:click=|e| e.stop_propagation()
            >
                "📧"
            </a>
        </div>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn employee_initials() {
        let emp = Employee {
            id: "1".to_string(),
            name: "John Doe".to_string(),
            title: "Engineer".to_string(),
            department: "Engineering".to_string(),
            email: "john@example.com".to_string(),
            building: None,
            floor: None,
            desk: None,
            phone: None,
            photo_url: None,
            bio: None,
        };
        assert_eq!(emp.initials(), "JD");
    }

    #[test]
    fn employee_location_full() {
        let emp = Employee {
            id: "1".to_string(),
            name: "Jane".to_string(),
            title: "Manager".to_string(),
            department: "HR".to_string(),
            email: "jane@example.com".to_string(),
            building: Some("HQ".to_string()),
            floor: Some("3rd Floor".to_string()),
            desk: Some("D-301".to_string()),
            phone: None,
            photo_url: None,
            bio: None,
        };
        assert_eq!(emp.location(), "HQ, 3rd Floor, D-301");
    }
}
