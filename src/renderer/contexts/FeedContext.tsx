import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RSSFeed, Article, Category } from '../../shared/types';

interface FeedContextType {
  feeds: RSSFeed[];
  articles: Article[];
  favorites: Article[];
  categories: Category[];
  selectedCategory: string | null;
  selectedFeed: number | null;
  loading: boolean;
  
  refreshFeeds: () => Promise<void>;
  addFeed: (url: string, title: string, category: string) => Promise<void>;
  deleteFeed: (id: number) => Promise<void>;
  updateFeed: (id: number, data: Partial<RSSFeed>) => Promise<void>;
  selectCategory: (category: string | null) => void;
  selectFeed: (feedId: number | null) => void;
  toggleFavorite: (articleId: number) => Promise<void>;
  refreshAllFeeds: () => Promise<void>;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error('useFeed must be used within a FeedContextProvider');
  }
  return context;
};

interface FeedContextProviderProps {
  children: ReactNode;
}

export const FeedContextProvider: React.FC<FeedContextProviderProps> = ({ children }) => {
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [favorites, setFavorites] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFeed, setSelectedFeed] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshFeeds = async () => {
    try {
      setLoading(true);
      const feedsData = await window.electronAPI.getFeedsData();
      setFeeds(feedsData);
      
      const categoryMap = new Map<string, number>();
      feedsData.forEach(feed => {
        categoryMap.set(feed.category, (categoryMap.get(feed.category) || 0) + 1);
      });
      
      const categoriesData = Array.from(categoryMap.entries()).map(([name, count]) => ({
        name,
        count,
      }));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to refresh feeds:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshArticles = async () => {
    try {
      setLoading(true);
      
      if (selectedCategory === 'favorites') {
        const favoritesData = await window.electronAPI.getFavorites();
        setArticles(favoritesData);
        setFavorites(favoritesData);
      } else {
        const articlesData = await window.electronAPI.getArticles(
          selectedFeed || undefined,
          selectedCategory || undefined
        );
        setArticles(articlesData);
        
        const favoritesData = await window.electronAPI.getFavorites();
        setFavorites(favoritesData);
      }
    } catch (error) {
      console.error('Failed to refresh articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFeed = async (url: string, title: string, category: string) => {
    try {
      await window.electronAPI.addFeed(url, title, category);
      await refreshFeeds();
      await refreshArticles();
    } catch (error) {
      console.error('Failed to add feed:', error);
      throw error;
    }
  };

  const deleteFeed = async (id: number) => {
    try {
      await window.electronAPI.deleteFeed(id);
      await refreshFeeds();
      await refreshArticles();
    } catch (error) {
      console.error('Failed to delete feed:', error);
      throw error;
    }
  };

  const updateFeed = async (id: number, data: Partial<RSSFeed>) => {
    try {
      await window.electronAPI.updateFeed(id, data);
      await refreshFeeds();
      await refreshArticles();
    } catch (error) {
      console.error('Failed to update feed:', error);
      throw error;
    }
  };

  const selectCategory = (category: string | null) => {
    setSelectedCategory(category);
    setSelectedFeed(null);
  };

  const selectFeed = (feedId: number | null) => {
    setSelectedFeed(feedId);
    setSelectedCategory(null);
  };

  const toggleFavorite = async (articleId: number) => {
    try {
      const isFavorite = favorites.some(fav => fav.id === articleId);
      if (isFavorite) {
        await window.electronAPI.removeFromFavorites(articleId);
      } else {
        await window.electronAPI.addToFavorites(articleId);
      }
      await refreshArticles();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const refreshAllFeeds = async () => {
    try {
      setLoading(true);
      await window.electronAPI.refreshAllFeeds();
      await refreshArticles();
    } catch (error) {
      console.error('Failed to refresh all feeds:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFeeds();
  }, []);

  useEffect(() => {
    refreshArticles();
  }, [selectedCategory, selectedFeed]);

  return (
    <FeedContext.Provider
      value={{
        feeds,
        articles,
        favorites,
        categories,
        selectedCategory,
        selectedFeed,
        loading,
        refreshFeeds,
        addFeed,
        deleteFeed,
        updateFeed,
        selectCategory,
        selectFeed,
        toggleFavorite,
        refreshAllFeeds,
      }}
    >
      {children}
    </FeedContext.Provider>
  );
};