use crate::error::Result;

use super::{Database, Model};

impl Database {
    /// ---- Models ----
    pub async fn get_models_by_provider(&self, provider_id: &str) -> Result<Vec<Model>> {
        let records = sqlx::query_as::<_, Model>(
            r#"SELECT id, provider_id, name, is_enabled FROM models WHERE provider_id = ? ORDER BY name ASC"#,
        )
        .bind(provider_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(records
            .into_iter()
            .map(|record| Model {
                id: record.id,
                provider_id: record.provider_id,
                name: record.name,
                is_enabled: record.is_enabled,
            })
            .collect())
    }

    pub async fn upsert_model(&self, model: &Model) -> Result<()> {
        let is_enabled_int = if model.is_enabled { 1 } else { 0 };

        sqlx::query(r#"INSERT OR REPLACE INTO models (id, provider_id, name, is_enabled) VALUES (?, ?, ?, ?)"#)
            .bind(&model.id)
            .bind(&model.provider_id)
            .bind(&model.name)
            .bind(is_enabled_int)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
