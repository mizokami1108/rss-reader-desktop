import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Toolbar,
  Collapse,
  Chip,
  Button,
} from '@mui/material';
import {
  RssFeed,
  Star,
  Category,
  Add,
  Settings,
  DarkMode,
  LightMode,
  ExpandLess,
  ExpandMore,
  Delete,
  Slideshow,
} from '@mui/icons-material';
import { useFeed } from '../../contexts/FeedContext';
import { useTheme } from '../../contexts/ThemeContext';
import FeedManager from '../FeedManager/FeedManager';

interface SidebarProps {
  onStartAutoViewer?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onStartAutoViewer }) => {
  const {
    feeds,
    categories,
    selectedCategory,
    selectedFeed,
    selectCategory,
    selectFeed,
    deleteFeed,
    articles,
  } = useFeed();
  const { mode, toggleTheme } = useTheme();
  
  const [feedManagerOpen, setFeedManagerOpen] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [feedsExpanded, setFeedsExpanded] = useState(true);

  const handleDeleteFeed = async (feedId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('このフィードを削除してもよろしいですか？')) {
      await deleteFeed(feedId);
    }
  };

  return (
    <>
      <Toolbar variant="dense" sx={{ minHeight: '48px' }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 500 }}>
          ナビゲーション
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="small" onClick={toggleTheme}>
          {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
        </IconButton>
      </Toolbar>
      
      <Divider />
      
      <Box sx={{ overflow: 'auto', flex: 1 }}>
        <List dense>
          <ListItem disablePadding>
            <ListItemButton
              selected={!selectedCategory && !selectedFeed}
              onClick={() => {
                selectCategory(null);
                selectFeed(null);
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <RssFeed fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="すべての記事" 
                primaryTypographyProps={{ fontSize: '0.875rem' }}
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton onClick={() => selectCategory('favorites')}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Star fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="お気に入り" 
                primaryTypographyProps={{ fontSize: '0.875rem' }}
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton 
              onClick={onStartAutoViewer}
              disabled={articles.length === 0}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Slideshow fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="自動RSS表示" 
                primaryTypographyProps={{ fontSize: '0.875rem' }}
              />
            </ListItemButton>
          </ListItem>

          <Divider sx={{ my: 1 }} />

          <ListItem disablePadding>
            <ListItemButton onClick={() => setCategoriesExpanded(!categoriesExpanded)}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Category fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="カテゴリ" 
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
              />
              {categoriesExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>

          <Collapse in={categoriesExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {categories.map((category) => (
                <ListItem key={category.name} disablePadding sx={{ pl: 2 }}>
                  <ListItemButton
                    selected={selectedCategory === category.name}
                    onClick={() => selectCategory(category.name)}
                  >
                    <ListItemText 
                      primary={category.name}
                      primaryTypographyProps={{ fontSize: '0.8125rem' }}
                    />
                    <Chip 
                      label={category.count} 
                      size="small" 
                      sx={{ height: 16, fontSize: '0.625rem' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>

          <Divider sx={{ my: 1 }} />

          <ListItem disablePadding>
            <ListItemButton onClick={() => setFeedsExpanded(!feedsExpanded)}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <RssFeed fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="フィード" 
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
              />
              {feedsExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>

          <Collapse in={feedsExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {feeds.map((feed) => (
                <ListItem key={feed.id} disablePadding sx={{ pl: 2 }}>
                  <ListItemButton
                    selected={selectedFeed === feed.id}
                    onClick={() => selectFeed(feed.id)}
                  >
                    <ListItemText
                      primary={feed.title}
                      secondary={feed.category}
                      primaryTypographyProps={{ 
                        fontSize: '0.8125rem',
                        sx: { 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }
                      }}
                      secondaryTypographyProps={{ fontSize: '0.6875rem' }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => handleDeleteFeed(feed.id, e)}
                      sx={{ ml: 1, opacity: 0.6 }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </List>
      </Box>

      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setFeedManagerOpen(true)}
          size="small"
        >
          RSSフィード追加
        </Button>
      </Box>

      <FeedManager
        open={feedManagerOpen}
        onClose={() => setFeedManagerOpen(false)}
      />
    </>
  );
};

export default Sidebar;