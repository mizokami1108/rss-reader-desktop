import Parser from 'rss-parser';
import { feedQueries, articleQueries } from '../database/queries';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'RSS Reader Desktop/1.0.0 (compatible; RSS Parser)'
  },
  customFields: {
    feed: ['description', 'language'],
    item: ['summary', 'content:encoded', 'content', 'media:thumbnail', 'media:content', 'enclosure'],
  },
});

// 画像URLを抽出する関数
const extractImageUrl = (item: any): string | null => {
  // 1. media:thumbnail から取得
  if (item['media:thumbnail'] && item['media:thumbnail'].$ && item['media:thumbnail'].$.url) {
    return item['media:thumbnail'].$.url;
  }
  
  // 2. media:content から取得
  if (item['media:content'] && Array.isArray(item['media:content'])) {
    for (const media of item['media:content']) {
      if (media.$ && media.$.type && media.$.type.startsWith('image/') && media.$.url) {
        return media.$.url;
      }
    }
  }
  
  // 3. enclosure から取得
  if (item.enclosure && item.enclosure.type && item.enclosure.type.startsWith('image/') && item.enclosure.url) {
    return item.enclosure.url;
  }
  
  // 4. コンテンツ内の最初の画像を抽出
  const content = item['content:encoded'] || item.content || item.summary || '';
  if (typeof content === 'string') {
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
  }
  
  return null;
};

export const fetchRSSFeed = async (url: string) => {
  try {
    const feed = await parser.parseURL(url);
    
    const articles = feed.items.map(item => ({
      title: item.title || 'Untitled',
      description: item.summary || item.contentSnippet || '',
      content: item['content:encoded'] || item.content || item.contentSnippet || '',
      url: item.link || '',
      publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
      imageUrl: extractImageUrl(item),
    }));

    return {
      title: feed.title || 'Untitled Feed',
      description: feed.description || '',
      articles,
    };
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    
    if (error instanceof Error) {
      // Network connectivity errors
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        throw new Error('URLにアクセスできません。インターネット接続とURLを確認してください。');
      } 
      // SSL/TLS certificate errors
      else if (error.message.includes('CERT') || error.message.includes('SSL') || error.message.includes('DEPTH_ZERO_SELF_SIGNED')) {
        throw new Error('SSL証明書に問題があります。サイトの安全性を確認してください。');
      } 
      // Timeout errors
      else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        throw new Error('接続がタイムアウトしました。しばらくしてから再試行してください。');
      } 
      // HTTP status errors
      else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('このRSSフィードへのアクセスが拒否されました。User-Agentやアクセス許可を確認してください。');
      } 
      else if (error.message.includes('404') || error.message.includes('Not Found')) {
        throw new Error('RSSフィードが見つかりません。URLが正しいか確認してください。');
      }
      else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error('認証が必要なRSSフィードです。認証情報を確認してください。');
      }
      else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
        throw new Error('RSSフィードのサーバーに問題があります。しばらくしてから再試行してください。');
      }
      // XML/RSS parsing errors
      else if (error.message.includes('parse') || error.message.includes('XML') || error.message.includes('Invalid')) {
        throw new Error('RSSフィードの形式が正しくありません。有効なRSSフィードか確認してください。');
      }
      // Rate limiting
      else if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        throw new Error('リクエスト数が多すぎます。しばらく時間をおいてから再試行してください。');
      }
    }
    
    throw new Error(`RSSフィードの取得に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          article.publishedAt,
          article.imageUrl
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