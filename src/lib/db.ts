import Database from '@tauri-apps/plugin-sql';

let dbInstance: Database | null = null;

/**
 * 获取基于 Tauri-Plugin-SQL (SQLite) 的全局唯一数据库连接实例。
 * @description 懒加载建立针对 `sqlite:banana.db` 的持久化本地存储引擎。
 */
export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  
  dbInstance = await Database.load('sqlite:banana.db');
  return dbInstance;
}

/**
 * Global configuration settings (e.g. active provider)
 */
export async function setConfig(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execute('INSERT OR REPLACE INTO config (key, value) VALUES ($1, $2)', [key, value]);
}

export async function getConfig(key: string): Promise<string | null> {
  const db = await getDb();
  const result = await db.select<{ value: string }[]>('SELECT value FROM config WHERE key = $1', [key]);
  return result.length > 0 ? result[0].value : null;
}

/**
 * Threads (Conversations)
 */
export interface Thread {
  id: string;
  title: string;
  created_at: string;
}

export async function getThreads(): Promise<Thread[]> {
  const db = await getDb();
  return db.select<Thread[]>('SELECT * FROM threads ORDER BY created_at DESC');
}

export async function createThread(id: string, title: string): Promise<void> {
  const db = await getDb();
  await db.execute('INSERT INTO threads (id, title) VALUES ($1, $2)', [id, title]);
}

/**
 * Messages
 */
export interface Message {
  id: string;
  thread_id: string;
  role: string;
  content: string;
  created_at: string;
}

export async function getMessages(threadId: string): Promise<Message[]> {
  const db = await getDb();
  return db.select<Message[]>('SELECT * FROM messages WHERE thread_id = $1 ORDER BY created_at ASC', [threadId]);
}

export async function appendMessage(msg: Omit<Message, 'created_at'>): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT INTO messages (id, thread_id, role, content) VALUES ($1, $2, $3, $4)', 
    [msg.id, msg.thread_id, msg.role, msg.content]
  );
}
