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
  refreshAllFeeds: () => Promise<Array<{feedId: number; articleCount?: number; success: boolean; error?: string}>>;
  
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
  getTheme: () => Promise<'light' | 'dark'>;
  
  getAutoViewerSpeed: () => Promise<number>;
  setAutoViewerSpeed: (speed: number) => Promise<void>;
  
  openExternalLink: (url: string) => Promise<void>;
  
  onFeedProgress: (callback: (data: FeedProgressData) => void) => () => void;
  onRefreshProgress: (callback: (data: RefreshProgressData) => void) => () => void;
}

export interface FeedProgressData {
  step: 'fetching' | 'creating' | 'importing' | 'finalizing' | 'completed' | 'error';
  message: string;
  progress: number;
}

export interface RefreshProgressData {
  step: 'starting' | 'updating' | 'completed' | 'error';
  message: string;
  progress: number;
  current: number;
  total: number;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}