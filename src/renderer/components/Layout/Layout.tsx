import React, { useState } from 'react';
import { Box, Drawer, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { Menu as MenuIcon, Refresh, Slideshow } from '@mui/icons-material';
import Sidebar from '../Sidebar/Sidebar';
import ArticleList from '../ArticleList/ArticleList';
import ArticleReader from '../ArticleReader/ArticleReader';
import AutoViewer from '../AutoViewer/AutoViewer';
import { useFeed } from '../../contexts/FeedContext';
import { Article } from '../../../shared/types';

const DRAWER_WIDTH = 280;

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [autoViewerOpen, setAutoViewerOpen] = useState(false);
  const { refreshAllFeeds, loading, articles } = useFeed();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleRefreshAll = async () => {
    await refreshAllFeeds();
  };

  const handleArticleSelect = (article: Article) => {
    setSelectedArticle(article);
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
  };

  const handleStartAutoViewer = () => {
    if (articles.length === 0) {
      alert('表示する記事がありません');
      return;
    }
    setAutoViewerOpen(true);
  };

  const handleCloseAutoViewer = () => {
    setAutoViewerOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar variant="dense">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontSize: '1rem' }}>
RSSリーダー
          </Typography>
          <IconButton
            color="inherit"
            onClick={handleStartAutoViewer}
            disabled={loading || articles.length === 0}
            size="small"
            title="自動RSS表示"
          >
            <Slideshow />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={handleRefreshAll}
            disabled={loading}
            size="small"
            title="全フィード更新"
          >
            <Refresh />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          <Sidebar onStartAutoViewer={handleStartAutoViewer} />
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          <Sidebar onStartAutoViewer={handleStartAutoViewer} />
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Toolbar variant="dense" />
        {selectedArticle ? (
          <ArticleReader
            article={selectedArticle}
            onBack={handleBackToList}
          />
        ) : (
          <ArticleList onArticleSelect={handleArticleSelect} />
        )}
      </Box>

      {/* Auto RSS Viewer */}
      <AutoViewer
        open={autoViewerOpen}
        onClose={handleCloseAutoViewer}
        articles={articles}
      />
    </Box>
  );
};

export default Layout;