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
      // Send progress: Fetching RSS feed
      event.sender.send('feed:progress', { 
        step: 'fetching', 
        message: 'RSSフィードを取得中...',
        progress: 20
      });

      // Validate RSS feed first
      const feedData = await fetchRSSFeed(url);
      const actualTitle = title || feedData.title;
      
      // Send progress: Creating feed
      event.sender.send('feed:progress', { 
        step: 'creating', 
        message: 'フィードを作成中...',
        progress: 40
      });
      
      const feedId = feedQueries.create(actualTitle, url, category);
      
      // Send progress: Importing articles
      event.sender.send('feed:progress', { 
        step: 'importing', 
        message: `記事を取り込み中... (${feedData.articles.length}件)`,
        progress: 60
      });
      
      // Import initial articles
      let importedCount = 0;
      for (const article of feedData.articles) {
        try {
          articleQueries.create(
            feedId,
            article.title,
            article.description,
            article.content,
            article.url,
            article.publishedAt,
            article.imageUrl
          );
          importedCount++;
          
          // Send progress updates during import
          const importProgress = 60 + (importedCount / feedData.articles.length) * 30;
          event.sender.send('feed:progress', { 
            step: 'importing', 
            message: `記事を取り込み中... (${importedCount}/${feedData.articles.length})`,
            progress: Math.round(importProgress)
          });
        } catch (error) {
          // Article might already exist
        }
      }
      
      // Send progress: Finalizing
      event.sender.send('feed:progress', { 
        step: 'finalizing', 
        message: '完了中...',
        progress: 95
      });
      
      feedQueries.updateLastFetched(feedId);
      
      // Send completion
      event.sender.send('feed:progress', { 
        step: 'completed', 
        message: `フィードを追加しました (${importedCount}件の記事)`,
        progress: 100
      });
      
      return feedQueries.getById(feedId);
    } catch (error) {
      // Send error
      event.sender.send('feed:progress', { 
        step: 'error', 
        message: error instanceof Error ? error.message : 'フィードの追加に失敗しました。',
        progress: 0
      });
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

  ipcMain.handle('rss:refreshAll', async (event) => {
    const results = [];
    const feeds = feedQueries.getAll();
    
    // Send initial progress
    event.sender.send('refresh:progress', { 
      step: 'starting', 
      message: `${feeds.length}個のフィードを更新中...`,
      progress: 0,
      current: 0,
      total: feeds.length
    });

    for (let i = 0; i < feeds.length; i++) {
      const feed = feeds[i];
      try {
        // Send progress for current feed
        event.sender.send('refresh:progress', { 
          step: 'updating', 
          message: `"${feed.title}" を更新中...`,
          progress: Math.round((i / feeds.length) * 100),
          current: i + 1,
          total: feeds.length
        });

        const feedData = await fetchRSSFeed(feed.url);
        let newArticleCount = 0;
        
        for (const article of feedData.articles) {
          try {
            articleQueries.create(
              feed.id,
              article.title,
              article.description,
              article.content,
              article.url,
              article.publishedAt,
              article.imageUrl
            );
            newArticleCount++;
          } catch (error) {
            // Article might already exist, which is fine
          }
        }

        feedQueries.updateLastFetched(feed.id);
        results.push({ feedId: feed.id, articleCount: newArticleCount, success: true });
      } catch (error) {
        console.error(`Failed to refresh feed ${feed.id}:`, error);
        results.push({ 
          feedId: feed.id, 
          error: error instanceof Error ? error.message : 'Unknown error', 
          success: false 
        });
      }
    }

    // Send completion
    const totalNewArticles = results.reduce((sum, result) => sum + (result.articleCount || 0), 0);
    event.sender.send('refresh:progress', { 
      step: 'completed', 
      message: `更新完了 (${totalNewArticles}件の新しい記事)`,
      progress: 100,
      current: feeds.length,
      total: feeds.length
    });

    return results;
  });

  // Theme operations
  ipcMain.handle('theme:get', () => {
    return settingsQueries.get('theme') || 'light';
  });

  ipcMain.handle('theme:set', (event, theme: string) => {
    settingsQueries.set('theme', theme);
  });

  // Auto Viewer settings operations
  ipcMain.handle('autoviewer:getSpeed', () => {
    return Number(settingsQueries.get('autoviewer_speed')) || 5000;
  });

  ipcMain.handle('autoviewer:setSpeed', (event, speed: number) => {
    settingsQueries.set('autoviewer_speed', speed.toString());
  });

  // External link operations
  ipcMain.handle('shell:openExternal', async (event, url: string) => {
    const { shell } = require('electron');
    try {
      await shell.openExternal(url);
    } catch (error) {
      console.error('Failed to open external URL:', error);
      throw error;
    }
  });
};