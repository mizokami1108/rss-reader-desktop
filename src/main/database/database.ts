import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'rss-reader.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

export const initializeDatabase = () => {
  const createFeedsTable = `
    CREATE TABLE IF NOT EXISTS feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL DEFAULT 'General',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_fetched DATETIME
    )
  `;

  const createArticlesTable = `
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feed_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      url TEXT NOT NULL,
      image_url TEXT,
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (feed_id) REFERENCES feeds (id) ON DELETE CASCADE,
      UNIQUE(feed_id, url)
    )
  `;

  const createFavoritesTable = `
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE,
      UNIQUE(article_id)
    )
  `;

  const createSettingsTable = `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.exec(createFeedsTable);
  db.exec(createArticlesTable);
  db.exec(createFavoritesTable);
  db.exec(createSettingsTable);

  // マイグレーション: 既存のarticlesテーブルにimage_urlカラムを追加
  try {
    db.exec('ALTER TABLE articles ADD COLUMN image_url TEXT');
  } catch (error) {
    // カラムが既に存在する場合はエラーを無視
  }

  const insertDefaultTheme = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `);
  insertDefaultTheme.run('theme', 'light');
};

export default db;