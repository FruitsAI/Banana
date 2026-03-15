use crate::error::Result;

use super::{Database, Model};

impl Database {
    /// ---- Models ----
    pub async fn get_models_by_provider(&self, provider_id: &str) -> Result<Vec<Model>> {
        let records = sqlx::query_as::<_, Model>(
            r#"SELECT id, provider_id, name, is_enabled, group_name, capabilities, capabilities_source FROM models WHERE provider_id = ? ORDER BY name ASC"#,
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
                group_name: record.group_name,
                capabilities: record.capabilities,
                capabilities_source: record.capabilities_source,
            })
            .collect())
    }

    pub async fn upsert_model(&self, model: &Model) -> Result<()> {
        let is_enabled_int = if model.is_enabled { 1 } else { 0 };

        sqlx::query(
            r#"
            INSERT INTO models (id, provider_id, name, is_enabled, group_name, capabilities, capabilities_source)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                provider_id = excluded.provider_id,
                name = excluded.name,
                is_enabled = excluded.is_enabled,
                group_name = excluded.group_name,
                capabilities = excluded.capabilities,
                capabilities_source = excluded.capabilities_source
            "#,
        )
        .bind(&model.id)
        .bind(&model.provider_id)
        .bind(&model.name)
        .bind(is_enabled_int)
        .bind(&model.group_name)
        .bind(&model.capabilities)
        .bind(&model.capabilities_source)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn delete_model(&self, model_id: &str) -> Result<()> {
        sqlx::query(r#"DELETE FROM models WHERE id = ?"#)
            .bind(model_id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
