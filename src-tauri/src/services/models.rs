use crate::db::{Database, Model, Provider};
use crate::domain::models::{normalize_model, normalize_provider};
use crate::error::Result;

pub async fn get_providers(db: &Database) -> Result<Vec<Provider>> {
    db.get_providers().await
}

pub async fn upsert_provider(db: &Database, provider: &Provider) -> Result<()> {
    let normalized_provider = normalize_provider(provider)?;
    db.upsert_provider(&normalized_provider).await
}

pub async fn delete_provider(db: &Database, provider_id: &str) -> Result<()> {
    db.delete_provider(provider_id).await
}

pub async fn get_models_by_provider(db: &Database, provider_id: &str) -> Result<Vec<Model>> {
    db.get_models_by_provider(provider_id).await
}

pub async fn upsert_model(db: &Database, model: &Model) -> Result<()> {
    let normalized_model = normalize_model(model)?;
    db.upsert_model(&normalized_model).await
}

pub async fn delete_model(db: &Database, provider_id: &str, model_id: &str) -> Result<()> {
    db.delete_model(provider_id, model_id).await
}
