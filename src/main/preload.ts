import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  getFeedsData: () => ipcRenderer.invoke('db:getFeeds'),
  addFeed: (url: string, title: string, category: string) => 
    ipcRenderer.invoke('db:addFeed', url, title, category),
  deleteFeed: (id: number) => ipcRenderer.invoke('db:deleteFeed', id),
  updateFeed: (id: number, data: any) => ipcRenderer.invoke('db:updateFeed', id, data),
  
  // Article operations
  getArticles: (feedId?: number, category?: string) => 
    ipcRenderer.invoke('db:getArticles', feedId, category),
  addToFavorites: (articleId: number) => ipcRenderer.invoke('db:addToFavorites', articleId),
  removeFromFavorites: (articleId: number) => 
    ipcRenderer.invoke('db:removeFromFavorites', articleId),
  getFavorites: () => ipcRenderer.invoke('db:getFavorites'),
  
  // RSS operations
  fetchRSSFeed: (url: string) => ipcRenderer.invoke('rss:fetchFeed', url),
  refreshAllFeeds: () => ipcRenderer.invoke('rss:refreshAll'),
  
  // Theme operations
  setTheme: (theme: 'light' | 'dark') => ipcRenderer.invoke('theme:set', theme),
  getTheme: () => ipcRenderer.invoke('theme:get'),
  
  // Auto Viewer settings operations
  getAutoViewerSpeed: () => ipcRenderer.invoke('autoviewer:getSpeed'),
  setAutoViewerSpeed: (speed: number) => ipcRenderer.invoke('autoviewer:setSpeed', speed),
});