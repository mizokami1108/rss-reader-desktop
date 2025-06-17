import Parser from 'rss-parser';
import { feedQueries, articleQueries } from '../database/queries';

const parser = new Parser({
  customFields: {
    feed: ['description', 'language'],
    item: ['summary', 'content:encoded', 'content'],
  },
});

export const fetchRSSFeed = async (url: string) => {
  try {
    const feed = await parser.parseURL(url);
    
    const articles = feed.items.map(item => ({
      title: item.title || 'Untitled',
      description: item.summary || item.contentSnippet || '',
      content: item['content:encoded'] || item.content || item.contentSnippet || '',
      url: item.link || '',
      publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
    }));

    return {
      title: feed.title || 'Untitled Feed',
      description: feed.description || '',
      articles,
    };
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        throw new Error('URLにアクセスできません。インターネット接続とURLを確認してください。');
      } else if (error.message.includes('CERT') || error.message.includes('SSL')) {
        throw new Error('SSL証明書に問題があります。サイトの安全性を確認してください。');
      } else if (error.message.includes('timeout')) {
        throw new Error('接続がタイムアウトしました。しばらくしてから再試行してください。');
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('このRSSフィードへのアクセスが拒否されました。');
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        throw new Error('RSSフィードが見つかりません。URLが正しいか確認してください。');
      } else if (error.message.includes('parse') || error.message.includes('XML')) {
        throw new Error('RSSフィードの形式が正しくありません。有効なRSSフィードか確認してください。');
      }
    }
    
    throw new Error('RSSフィードの取得に失敗しました。URLが正しいか確認してください。');
  }
};

export const refreshFeed = async (feedId: number) => {
  try {
    const feed = feedQueries.getById(feedId);
    if (!feed) {
      throw new Error('フィードが見つかりません。');
    }

    const feedData = await fetchRSSFeed(feed.url);
    
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
        // Article might already exist, which is fine
      }
    }

    feedQueries.updateLastFetched(feedId);
    return feedData.articles.length;
  } catch (error) {
    console.error(`Error refreshing feed ${feedId}:`, error);
    throw error;
  }
};

export const refreshAllFeeds = async () => {
  const feeds = feedQueries.getAll();
  const results = [];

  for (const feed of feeds) {
    try {
      const articleCount = await refreshFeed(feed.id);
      results.push({ feedId: feed.id, articleCount, success: true });
    } catch (error) {
      console.error(`Failed to refresh feed ${feed.id}:`, error);
      results.push({ feedId: feed.id, error: error instanceof Error ? error.message : 'Unknown error', success: false });
    }
  }

  return results;
};