use crate::error::Result;

use super::{Database, Provider};

impl Database {
    /// ---- Providers ----
    pub async fn get_providers(&self) -> Result<Vec<Provider>> {
        let records = sqlx::query_as::<_, Provider>(
            r#"SELECT id, name, icon, is_enabled, api_key, base_url FROM providers ORDER BY is_enabled DESC, name ASC"#,
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
            })
            .collect())
    }

    pub async fn upsert_provider(&self, provider: &Provider) -> Result<()> {
        let is_enabled_int = if provider.is_enabled { 1 } else { 0 };

        sqlx::query(
            r#"INSERT OR REPLACE INTO providers (id, name, icon, is_enabled, api_key, base_url) VALUES (?, ?, ?, ?, ?, ?)"#,
        )
        .bind(&provider.id)
        .bind(&provider.name)
        .bind(&provider.icon)
        .bind(is_enabled_int)
        .bind(&provider.api_key)
        .bind(&provider.base_url)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}
