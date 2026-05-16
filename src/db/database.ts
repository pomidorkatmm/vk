import Database from 'better-sqlite3';
import path from 'node:path';
import { app } from 'electron';

let db: Database.Database;

export function getDb() {
  if (db) return db;
  const dbPath = path.join(app.getPath('userData'), 'community-watcher.sqlite');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
  CREATE TABLE IF NOT EXISTS communities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_checked_at TEXT
  );
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    community_id INTEGER NOT NULL,
    section TEXT NOT NULL,
    item_key TEXT NOT NULL UNIQUE,
    title TEXT,
    text TEXT,
    url TEXT,
    preview_url TEXT,
    published_at TEXT,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    FOREIGN KEY(community_id) REFERENCES communities(id)
  );
  `);
  return db;
}
