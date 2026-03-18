use crate::db::{Database, Model, Provider};
use crate::error::Result;

pub async fn get_providers(db: &Database) -> Result<Vec<Provider>> {
    db.get_providers().await
}

pub async fn upsert_provider(db: &Database, provider: &Provider) -> Result<()> {
    db.upsert_provider(provider).await
}

pub async fn delete_provider(db: &Database, provider_id: &str) -> Result<()> {
    db.delete_provider(provider_id).await
}

pub async fn get_models_by_provider(db: &Database, provider_id: &str) -> Result<Vec<Model>> {
    db.get_models_by_provider(provider_id).await
}

pub async fn upsert_model(db: &Database, model: &Model) -> Result<()> {
    db.upsert_model(model).await
}

pub async fn delete_model(db: &Database, model_id: &str) -> Result<()> {
    db.delete_model(model_id).await
}
