use crate::db::{Database, Message, Thread};
use crate::domain::chat::{sanitize_message, ThreadDraft, ThreadTitleUpdate};
use crate::error::Result;

pub async fn get_threads(db: &Database) -> Result<Vec<Thread>> {
    db.get_threads().await
}

pub async fn create_thread(
    db: &Database,
    id: &str,
    title: &str,
    model_id: Option<&str>,
) -> Result<()> {
    let draft = ThreadDraft::new(id, title, model_id)?;
    db.create_thread(&draft.id, &draft.title, draft.model_id.as_deref())
        .await
}

pub async fn update_thread_title(db: &Database, id: &str, title: &str) -> Result<()> {
    let update = ThreadTitleUpdate::new(id, title)?;
    db.update_thread_title(&update.id, &update.title).await
}

pub async fn delete_thread(db: &Database, id: &str) -> Result<()> {
    db.delete_thread(id).await
}

pub async fn get_messages(db: &Database, thread_id: &str) -> Result<Vec<Message>> {
    // Message rows now include canonical payloads via `ui_message_json` in addition to plain text.
    db.get_messages(thread_id).await
}

pub async fn append_message(db: &Database, msg: &Message) -> Result<()> {
    let normalized_message = sanitize_message(msg)?;
    db.append_message(&normalized_message).await
}

pub async fn delete_messages_after(db: &Database, thread_id: &str, message_id: &str) -> Result<()> {
    db.delete_messages_after(thread_id, message_id).await
}
