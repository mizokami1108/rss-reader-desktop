export interface RSSFeed {
  id: number;
  title: string;
  url: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  lastFetched?: string;
}

export interface Article {
  id: number;
  feedId: number;
  title: string;
  description: string;
  content: string;
  url: string;
  publishedAt: string;
  createdAt: string;
  isFavorite?: boolean;
  feedTitle?: string;
  feedCategory?: string;
}

export interface Category {
  name: string;
  count: number;
}

export interface AppTheme {
  mode: 'light' | 'dark';
}

export interface ElectronAPI {
  getFeedsData: () => Promise<RSSFeed[]>;
  addFeed: (url: string, title: string, category: string) => Promise<RSSFeed>;
  deleteFeed: (id: number) => Promise<void>;
  updateFeed: (id: number, data: Partial<RSSFeed>) => Promise<void>;
  
  getArticles: (feedId?: number, category?: string) => Promise<Article[]>;
  addToFavorites: (articleId: number) => Promise<void>;
  removeFromFavorites: (articleId: number) => Promise<void>;
  getFavorites: () => Promise<Article[]>;
  
  fetchRSSFeed: (url: string) => Promise<Article[]>;
  refreshAllFeeds: () => Promise<void>;
  
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
  getTheme: () => Promise<'light' | 'dark'>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}