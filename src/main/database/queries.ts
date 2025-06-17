import db from './database';
import { RSSFeed, Article } from '../../shared/types';

export const feedQueries = {
  getAll: () => {
    const stmt = db.prepare(`
      SELECT 
        id, title, url, category, 
        created_at as createdAt, 
        updated_at as updatedAt, 
        last_fetched as lastFetched
      FROM feeds
      ORDER BY category, title
    `);
    return stmt.all() as RSSFeed[];
  },

  getById: (id: number) => {
    const stmt = db.prepare(`
      SELECT 
        id, title, url, category, 
        created_at as createdAt, 
        updated_at as updatedAt, 
        last_fetched as lastFetched
      FROM feeds
      WHERE id = ?
    `);
    return stmt.get(id) as RSSFeed | undefined;
  },

  create: (title: string, url: string, category: string) => {
    const stmt = db.prepare(`
      INSERT INTO feeds (title, url, category)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(title, url, category);
    return result.lastInsertRowid as number;
  },

  update: (id: number, data: Partial<RSSFeed>) => {
    const fields = [];
    const values = [];
    
    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.url !== undefined) {
      fields.push('url = ?');
      values.push(data.url);
    }
    if (data.category !== undefined) {
      fields.push('category = ?');
      values.push(data.category);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const stmt = db.prepare(`
      UPDATE feeds
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    stmt.run(...values);
  },

  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM feeds WHERE id = ?');
    stmt.run(id);
  },

  updateLastFetched: (id: number) => {
    const stmt = db.prepare(`
      UPDATE feeds
      SET last_fetched = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(id);
  },
};

export const articleQueries = {
  getAll: (feedId?: number, category?: string) => {
    let query = `
      SELECT 
        a.id, 
        a.feed_id as feedId, 
        a.title, 
        a.description, 
        a.content, 
        a.url, 
        a.published_at as publishedAt, 
        a.created_at as createdAt,
        f.title as feedTitle, 
        f.category as feedCategory,
        CASE WHEN fav.article_id IS NOT NULL THEN 1 ELSE 0 END as isFavorite
      FROM articles a
      JOIN feeds f ON a.feed_id = f.id
      LEFT JOIN favorites fav ON a.id = fav.article_id
    `;
    
    const conditions = [];
    const params = [];
    
    if (feedId !== undefined) {
      conditions.push('a.feed_id = ?');
      params.push(feedId);
    }
    
    if (category !== undefined) {
      conditions.push('f.category = ?');
      params.push(category);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY a.published_at DESC, a.created_at DESC';
    
    const stmt = db.prepare(query);
    return stmt.all(...params) as Article[];
  },

  getById: (id: number) => {
    const stmt = db.prepare(`
      SELECT 
        a.id, 
        a.feed_id as feedId, 
        a.title, 
        a.description, 
        a.content, 
        a.url, 
        a.published_at as publishedAt, 
        a.created_at as createdAt,
        f.title as feedTitle, 
        f.category as feedCategory,
        CASE WHEN fav.article_id IS NOT NULL THEN 1 ELSE 0 END as isFavorite
      FROM articles a
      JOIN feeds f ON a.feed_id = f.id
      LEFT JOIN favorites fav ON a.id = fav.article_id
      WHERE a.id = ?
    `);
    return stmt.get(id) as Article | undefined;
  },

  create: (feedId: number, title: string, description: string, content: string, url: string, publishedAt?: string) => {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO articles (feed_id, title, description, content, url, published_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(feedId, title, description, content, url, publishedAt);
    return result.lastInsertRowid as number;
  },

  deleteByFeedId: (feedId: number) => {
    const stmt = db.prepare('DELETE FROM articles WHERE feed_id = ?');
    stmt.run(feedId);
  },
};

export const favoriteQueries = {
  getAll: () => {
    const stmt = db.prepare(`
      SELECT 
        a.id, 
        a.feed_id as feedId, 
        a.title, 
        a.description, 
        a.content, 
        a.url, 
        a.published_at as publishedAt, 
        a.created_at as createdAt,
        f.title as feedTitle, 
        f.category as feedCategory,
        1 as isFavorite
      FROM favorites fav
      JOIN articles a ON fav.article_id = a.id
      JOIN feeds f ON a.feed_id = f.id
      ORDER BY fav.created_at DESC
    `);
    return stmt.all() as Article[];
  },

  add: (articleId: number) => {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO favorites (article_id)
      VALUES (?)
    `);
    stmt.run(articleId);
  },

  remove: (articleId: number) => {
    const stmt = db.prepare('DELETE FROM favorites WHERE article_id = ?');
    stmt.run(articleId);
  },

  exists: (articleId: number) => {
    const stmt = db.prepare('SELECT 1 FROM favorites WHERE article_id = ?');
    return stmt.get(articleId) !== undefined;
  },
};

export const settingsQueries = {
  get: (key: string) => {
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get(key) as { value: string } | undefined;
    return result?.value;
  },

  set: (key: string, value: string) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(key, value);
  },
};