use crate::database::Database;
use anyhow::Result;

#[derive(Debug)]
pub struct TelemetrySystem {
    db: Database,
}

impl TelemetrySystem {
    pub async fn new() -> Result<Self> {
        let db = Database::init().await?;

        // Initialize Telemetry Schema
        Self::init_schema(&db).await?;

        Ok(Self { db })
    }

    async fn init_schema(db: &Database) -> Result<()> {
        // Device Table
        db.client.query("DEFINE TABLE device SCHEMAFULL;").await?;
        db.client.query("DEFINE FIELD type ON TABLE device TYPE string ASSERT $value INSIDE ['router', 'switch', 'cable', 'custom'];").await?;
        db.client
            .query("DEFINE FIELD metalog_coeffs ON TABLE device TYPE array<float>;")
            .await?;

        // Metric Table (Schemaless, optimized)
        db.client.query("DEFINE TABLE metric SCHEMALESS;").await?;
        db.client
            .query("DEFINE FIELD val ON TABLE metric TYPE float;")
            .await?;

        Ok(())
    }

    pub async fn log_metric(&self, device_id: u32, timestamp_nanos: u64, value: f64) -> Result<()> {
        // Optimized Array-based ID: metric:[device_id, timestamp]
        let sql = "CREATE type::thing('metric', [$id, $ts]) CONTENT { val: $val };";
        self.db
            .client
            .query(sql)
            .bind(("id", device_id))
            .bind(("ts", timestamp_nanos))
            .bind(("val", value))
            .await?;

        Ok(())
    }

    pub async fn get_total_packets(&self) -> Result<usize> {
        let mut response = self.db.client.query("SELECT * FROM metric;").await?;
        let result: Vec<serde::de::IgnoredAny> = response.take(0)?;
        tracing::info!("Analysis: Retrieved {} metrics", result.len());
        Ok(result.len())
    }
}

// Tracing subscriber integration
pub fn init_tracing() {
    let subscriber = tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber).expect("setting default subscriber failed");
}
