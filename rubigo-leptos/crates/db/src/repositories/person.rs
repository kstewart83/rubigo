//! Person repository

use crate::client::DbClient;
use crate::models::Person;
use anyhow::Result;

pub struct PersonRepository;

impl PersonRepository {
    /// List all people
    pub async fn list_all(db: &DbClient) -> Result<Vec<Person>> {
        let people: Vec<Person> = db.select("person").await?;
        Ok(people)
    }

    /// Get person by ID
    pub async fn get_by_id(db: &DbClient, id: &str) -> Result<Option<Person>> {
        let person: Option<Person> = db.select(("person", id)).await?;
        Ok(person)
    }

    /// Create a new person
    pub async fn create(db: &DbClient, person: Person) -> Result<Person> {
        let created: Option<Person> = db.create("person").content(person).await?;
        created.ok_or_else(|| anyhow::anyhow!("Failed to create person"))
    }

    /// Create a person with a specific ID
    pub async fn create_with_id(db: &DbClient, id: &str, person: Person) -> Result<Person> {
        let created: Option<Person> = db.create(("person", id)).content(person).await?;
        created.ok_or_else(|| anyhow::anyhow!("Failed to create person with id {}", id))
    }

    /// Update a person
    pub async fn update(db: &DbClient, id: &str, person: Person) -> Result<Person> {
        let updated: Option<Person> = db.update(("person", id)).content(person).await?;
        updated.ok_or_else(|| anyhow::anyhow!("Person not found: {}", id))
    }

    /// Delete a person
    pub async fn delete(db: &DbClient, id: &str) -> Result<()> {
        let _: Option<Person> = db.delete(("person", id)).await?;
        Ok(())
    }

    /// Find people by department
    pub async fn find_by_department(db: &DbClient, department: &str) -> Result<Vec<Person>> {
        let people: Vec<Person> = db
            .query("SELECT * FROM person WHERE department = $dept")
            .bind(("dept", department.to_string()))
            .await?
            .take(0)?;
        Ok(people)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Database;

    #[tokio::test]
    async fn create_and_list_person() {
        let db = Database::init().await.unwrap();

        let person = Person {
            id: None,
            short_id: Some("abc123".to_string()),
            name: "Test User".to_string(),
            email: "test@example.com".to_string(),
            title: "Developer".to_string(),
            department: "Engineering".to_string(),
            site_id: None,
            building_id: None,
            space_id: None,
            manager_id: None,
            photo: None,
            desk_phone: None,
            cell_phone: None,
            bio: None,
        };

        let created = PersonRepository::create(&db.client, person).await.unwrap();
        assert_eq!(created.name, "Test User");

        let all = PersonRepository::list_all(&db.client).await.unwrap();
        assert_eq!(all.len(), 1);
    }
}
