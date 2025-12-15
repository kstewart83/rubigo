//! Personnel action handlers

use actions::{PersonnelAction, PersonnelResponse, PersonData, PersonnelListQuery};
use db::client::DbClient;
use db::repositories::PersonRepository;
use anyhow::Result;

/// Handle personnel actions
pub async fn handle(db: &DbClient, action: PersonnelAction) -> Result<PersonnelResponse> {
    match action {
        PersonnelAction::List(query) => list(db, query).await,
        PersonnelAction::Get(id) => get(db, &id).await,
    }
}

async fn list(db: &DbClient, query: PersonnelListQuery) -> Result<PersonnelResponse> {
    let people = if let Some(ref dept) = query.department {
        PersonRepository::find_by_department(db, dept).await?
    } else {
        PersonRepository::list_all(db).await?
    };
    
    // Convert db::Person to actions::PersonData
    let data: Vec<PersonData> = people
        .into_iter()
        .filter(|p| {
            // Apply search filter if present
            if let Some(ref search) = query.search {
                let search_lower = search.to_lowercase();
                p.name.to_lowercase().contains(&search_lower) ||
                p.email.to_lowercase().contains(&search_lower)
            } else {
                true
            }
        })
        .map(|p| PersonData {
            id: p.short_id.unwrap_or_else(|| {
                p.id.map(|t| t.id.to_string()).unwrap_or_default()
            }),
            name: p.name,
            email: Some(p.email),
            department: Some(p.department),
            title: Some(p.title),
        })
        .collect();
    
    Ok(PersonnelResponse::List(data))
}

async fn get(db: &DbClient, id: &str) -> Result<PersonnelResponse> {
    match PersonRepository::get_by_id(db, id).await? {
        Some(p) => Ok(PersonnelResponse::Single(PersonData {
            id: p.short_id.unwrap_or_else(|| id.to_string()),
            name: p.name,
            email: Some(p.email),
            department: Some(p.department),
            title: Some(p.title),
        })),
        None => Ok(PersonnelResponse::Error(format!("Person not found: {}", id))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use db::Database;

    #[tokio::test]
    async fn list_empty_personnel() {
        let db = Database::init().await.unwrap();
        let query = PersonnelListQuery::default();
        
        let result = handle(&db.client, PersonnelAction::List(query)).await.unwrap();
        
        match result {
            PersonnelResponse::List(people) => {
                assert!(people.is_empty()); // Empty DB
            }
            _ => panic!("Expected List response"),
        }
    }
}
