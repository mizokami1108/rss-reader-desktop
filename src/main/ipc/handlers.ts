import { ipcMain } from 'electron';
import { feedQueries, articleQueries, favoriteQueries, settingsQueries } from '../database/queries';
import { fetchRSSFeed, refreshAllFeeds } from '../services/rssService';

export const setupIpcHandlers = () => {
  // Feed operations
  ipcMain.handle('db:getFeeds', () => {
    return feedQueries.getAll();
  });

  ipcMain.handle('db:addFeed', async (event, url: string, title: string, category: string) => {
    try {
      // Validate RSS feed first
      const feedData = await fetchRSSFeed(url);
      const actualTitle = title || feedData.title;
      
      const feedId = feedQueries.create(actualTitle, url, category);
      
      // Import initial articles
      for (const article of feedData.articles) {
        try {
          articleQueries.create(
            feedId,
            article.title,
            article.description,
            article.content,
            article.url,
            article.publishedAt
          );
        } catch (error) {
          // Article might already exist
        }
      }
      
      feedQueries.updateLastFetched(feedId);
      return feedQueries.getById(feedId);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'フィードの追加に失敗しました。');
    }
  });

  ipcMain.handle('db:deleteFeed', (event, id: number) => {
    articleQueries.deleteByFeedId(id);
    feedQueries.delete(id);
  });

  ipcMain.handle('db:updateFeed', (event, id: number, data: any) => {
    feedQueries.update(id, data);
  });

  // Article operations
  ipcMain.handle('db:getArticles', (event, feedId?: number, category?: string) => {
    return articleQueries.getAll(feedId, category);
  });

  // Favorites operations
  ipcMain.handle('db:addToFavorites', (event, articleId: number) => {
    favoriteQueries.add(articleId);
  });

  ipcMain.handle('db:removeFromFavorites', (event, articleId: number) => {
    favoriteQueries.remove(articleId);
  });

  ipcMain.handle('db:getFavorites', () => {
    return favoriteQueries.getAll();
  });

  // RSS operations
  ipcMain.handle('rss:fetchFeed', async (event, url: string) => {
    try {
      const feedData = await fetchRSSFeed(url);
      return feedData.articles;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'RSSフィードの取得に失敗しました。');
    }
  });

  ipcMain.handle('rss:refreshAll', async () => {
    return await refreshAllFeeds();
  });

  // Theme operations
  ipcMain.handle('theme:get', () => {
    return settingsQueries.get('theme') || 'light';
  });

  ipcMain.handle('theme:set', (event, theme: string) => {
    settingsQueries.set('theme', theme);
  });
};