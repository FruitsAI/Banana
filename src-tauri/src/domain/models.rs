use crate::db::{Model, Provider};
use crate::error::{AppError, Result};

fn require_non_empty(value: &str, field: &str) -> Result<String> {
    let normalized = value.trim();
    if normalized.is_empty() {
        return Err(AppError::InvalidConfig(format!("{field} cannot be empty")));
    }

    Ok(normalized.to_string())
}

fn normalize_optional(value: &Option<String>) -> Option<String> {
    value
        .as_deref()
        .map(str::trim)
        .filter(|text| !text.is_empty())
        .map(str::to_string)
}

pub fn normalize_provider(provider: &Provider) -> Result<Provider> {
    Ok(Provider {
        id: require_non_empty(&provider.id, "provider id")?,
        name: require_non_empty(&provider.name, "provider name")?,
        icon: require_non_empty(&provider.icon, "provider icon")?,
        is_enabled: provider.is_enabled,
        api_key: normalize_optional(&provider.api_key),
        base_url: normalize_optional(&provider.base_url),
        provider_type: normalize_optional(&provider.provider_type)
            .or_else(|| Some("openai".to_string())),
    })
}

pub fn normalize_model(model: &Model) -> Result<Model> {
    Ok(Model {
        id: require_non_empty(&model.id, "model id")?,
        provider_id: require_non_empty(&model.provider_id, "provider id")?,
        name: require_non_empty(&model.name, "model name")?,
        is_enabled: model.is_enabled,
        group_name: normalize_optional(&model.group_name),
        capabilities: normalize_optional(&model.capabilities),
        capabilities_source: normalize_optional(&model.capabilities_source),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_provider_defaults_provider_type() {
        let provider = Provider {
            id: " openai ".to_string(),
            name: " OpenAI ".to_string(),
            icon: " O ".to_string(),
            is_enabled: true,
            api_key: Some(" secret ".to_string()),
            base_url: Some(" https://api.openai.com/v1 ".to_string()),
            provider_type: None,
        };

        let normalized = normalize_provider(&provider).expect("provider should be valid");

        assert_eq!(normalized.id, "openai");
        assert_eq!(normalized.provider_type.as_deref(), Some("openai"));
        assert_eq!(normalized.api_key.as_deref(), Some("secret"));
    }

    #[test]
    fn normalize_model_rejects_blank_name() {
        let model = Model {
            id: "gpt-4o-mini".to_string(),
            provider_id: "openai".to_string(),
            name: "   ".to_string(),
            is_enabled: true,
            group_name: None,
            capabilities: None,
            capabilities_source: None,
        };

        assert!(normalize_model(&model).is_err());
    }
}
