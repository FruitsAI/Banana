use crate::error::Result;

use super::{Database, Provider};

impl Database {
    /// ---- Providers ----
    pub async fn get_providers(&self) -> Result<Vec<Provider>> {
        let records = sqlx::query_as::<_, Provider>(
            r#"SELECT id, name, icon, is_enabled, api_key, base_url, provider_type FROM providers ORDER BY is_enabled DESC, name ASC"#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(records
            .into_iter()
            .map(|record| Provider {
                id: record.id,
                name: record.name,
                icon: record.icon,
                is_enabled: record.is_enabled,
                api_key: record.api_key,
                base_url: record.base_url,
                provider_type: record.provider_type,
            })
            .collect())
    }

    pub async fn upsert_provider(&self, provider: &Provider) -> Result<()> {
        let is_enabled_int = if provider.is_enabled { 1 } else { 0 };

        sqlx::query(
            r#"
            INSERT INTO providers (id, name, icon, is_enabled, api_key, base_url, provider_type) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                icon = excluded.icon,
                is_enabled = excluded.is_enabled,
                api_key = excluded.api_key,
                base_url = excluded.base_url,
                provider_type = excluded.provider_type
            "#,
        )
        .bind(&provider.id)
        .bind(&provider.name)
        .bind(&provider.icon)
        .bind(is_enabled_int)
        .bind(&provider.api_key)
        .bind(&provider.base_url)
        .bind(&provider.provider_type)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn delete_provider(&self, provider_id: &str) -> Result<()> {
        sqlx::query(r#"DELETE FROM providers WHERE id = ?"#)
            .bind(provider_id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
