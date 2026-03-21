use crate::db::Message;
use crate::error::{AppError, Result};

const DEFAULT_THREAD_TITLE: &str = "新会话";

fn require_non_empty(value: &str, field: &str) -> Result<String> {
    let normalized = value.trim();
    if normalized.is_empty() {
        return Err(AppError::InvalidConfig(format!("{field} cannot be empty")));
    }

    Ok(normalized.to_string())
}

fn normalize_optional(value: Option<&str>) -> Option<String> {
    value
        .map(str::trim)
        .filter(|text| !text.is_empty())
        .map(str::to_string)
}

pub struct ThreadDraft {
    pub id: String,
    pub model_id: Option<String>,
    pub title: String,
}

impl ThreadDraft {
    pub fn new(id: &str, title: &str, model_id: Option<&str>) -> Result<Self> {
        Ok(Self {
            id: require_non_empty(id, "thread id")?,
            model_id: normalize_optional(model_id),
            title: normalize_thread_title(title),
        })
    }
}

pub struct ThreadTitleUpdate {
    pub id: String,
    pub title: String,
}

impl ThreadTitleUpdate {
    pub fn new(id: &str, title: &str) -> Result<Self> {
        Ok(Self {
            id: require_non_empty(id, "thread id")?,
            title: normalize_thread_title(title),
        })
    }
}

pub fn normalize_thread_title(title: &str) -> String {
    let normalized = title.trim();
    if normalized.is_empty() {
        DEFAULT_THREAD_TITLE.to_string()
    } else {
        normalized.to_string()
    }
}

pub fn sanitize_message(message: &Message) -> Result<Message> {
    Ok(Message {
        id: require_non_empty(&message.id, "message id")?,
        thread_id: require_non_empty(&message.thread_id, "thread id")?,
        role: require_non_empty(&message.role, "message role")?,
        content: require_non_empty(&message.content, "message content")?,
        model_id: normalize_optional(message.model_id.as_deref()),
        ui_message_json: normalize_optional(message.ui_message_json.as_deref()),
        created_at: message.created_at.clone(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn thread_title_falls_back_when_blank() {
        assert_eq!(normalize_thread_title("   "), "新会话");
    }

    #[test]
    fn thread_draft_trims_optional_model_id() {
        let draft = ThreadDraft::new(" thread-1 ", " Title ", Some(" gpt-4o-mini "))
            .expect("draft should be valid");

        assert_eq!(draft.id, "thread-1");
        assert_eq!(draft.title, "Title");
        assert_eq!(draft.model_id.as_deref(), Some("gpt-4o-mini"));
    }

    #[test]
    fn sanitize_message_rejects_empty_content() {
        let message = Message {
            id: "msg-1".to_string(),
            thread_id: "thread-1".to_string(),
            role: "user".to_string(),
            content: "   ".to_string(),
            model_id: None,
            ui_message_json: None,
            created_at: "2026-03-21T00:00:00Z".to_string(),
        };

        assert!(sanitize_message(&message).is_err());
    }
}
