//! Asset repository

use crate::client::DbClient;
use crate::models::NetworkAsset;
use anyhow::Result;

pub struct AssetRepository;

impl AssetRepository {
    /// List all assets
    pub async fn list_all(db: &DbClient) -> Result<Vec<NetworkAsset>> {
        let assets: Vec<NetworkAsset> = db.select("asset").await?;
        Ok(assets)
    }

    /// Get asset by ID
    pub async fn get_by_id(db: &DbClient, id: &str) -> Result<Option<NetworkAsset>> {
        let asset: Option<NetworkAsset> = db.select(("asset", id)).await?;
        Ok(asset)
    }

    /// Create a new asset
    pub async fn create(db: &DbClient, asset: NetworkAsset) -> Result<NetworkAsset> {
        let created: Option<NetworkAsset> = db.create("asset").content(asset).await?;
        created.ok_or_else(|| anyhow::anyhow!("Failed to create asset"))
    }

    /// Create asset with specific ID
    pub async fn create_with_id(
        db: &DbClient,
        id: &str,
        asset: NetworkAsset,
    ) -> Result<NetworkAsset> {
        let created: Option<NetworkAsset> = db.create(("asset", id)).content(asset).await?;
        created.ok_or_else(|| anyhow::anyhow!("Failed to create asset"))
    }

    /// Find assets by category
    pub async fn find_by_category(db: &DbClient, category: &str) -> Result<Vec<NetworkAsset>> {
        let assets: Vec<NetworkAsset> = db
            .query("SELECT * FROM asset WHERE category = $cat")
            .bind(("cat", category.to_string()))
            .await?
            .take(0)?;
        Ok(assets)
    }

    /// Find assets by status
    pub async fn find_by_status(db: &DbClient, status: &str) -> Result<Vec<NetworkAsset>> {
        let assets: Vec<NetworkAsset> = db
            .query("SELECT * FROM asset WHERE status = $status")
            .bind(("status", status.to_string()))
            .await?
            .take(0)?;
        Ok(assets)
    }
}
