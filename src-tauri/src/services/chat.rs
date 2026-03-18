use crate::db::{Database, Message, Thread};
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
    db.create_thread(id, title, model_id).await
}

pub async fn update_thread_title(db: &Database, id: &str, title: &str) -> Result<()> {
    db.update_thread_title(id, title).await
}

pub async fn delete_thread(db: &Database, id: &str) -> Result<()> {
    db.delete_thread(id).await
}

pub async fn get_messages(db: &Database, thread_id: &str) -> Result<Vec<Message>> {
    db.get_messages(thread_id).await
}

pub async fn append_message(db: &Database, msg: &Message) -> Result<()> {
    db.append_message(msg).await
}

pub async fn delete_messages_after(db: &Database, thread_id: &str, message_id: &str) -> Result<()> {
    db.delete_messages_after(thread_id, message_id).await
}

pub async fn update_message(db: &Database, id: &str, content: &str) -> Result<()> {
    db.update_message(id, content).await
}
