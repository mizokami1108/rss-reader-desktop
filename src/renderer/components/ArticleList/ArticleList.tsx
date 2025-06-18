import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Chip,
  Paper,
  CircularProgress,
} from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';
import { useFeed } from '../../contexts/FeedContext';
import { Article } from '../../../shared/types';

interface ArticleListProps {
  onArticleSelect: (article: Article) => void;
}

const ArticleList: React.FC<ArticleListProps> = ({ onArticleSelect }) => {
  const { articles, favorites, loading, selectedCategory, selectedFeed, toggleFavorite } = useFeed();

  // 記事を日付順（新しい順）でソート
  const sortArticlesByDate = (articles: Article[]) => {
    return [...articles].sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt).getTime();
      const dateB = new Date(b.publishedAt || b.createdAt).getTime();
      return dateB - dateA; // 新しい順（降順）
    });
  };

  const displayArticles = selectedCategory === 'favorites' 
    ? sortArticlesByDate(favorites) 
    : sortArticlesByDate(articles);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '不明';
    }
    
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'たった今';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}時間前`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}日前`;
    } else {
      return date.toLocaleDateString('ja-JP');
    }
  };

  const isArticleFavorite = (articleId: number) => {
    return favorites.some(fav => fav.id === articleId);
  };

  const handleToggleFavorite = async (articleId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    await toggleFavorite(articleId);
  };

  const getListTitle = () => {
    if (selectedCategory === 'favorites') {
      return 'お気に入り記事';
    } else if (selectedCategory && selectedCategory !== 'favorites') {
      return `${selectedCategory}の記事`;
    } else if (selectedFeed) {
      const feed = articles.find(a => a.feedId === selectedFeed);
      return feed ? `${feed.feedTitle}の記事` : '記事';
    } else {
      return 'すべての記事';
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
          {getListTitle()}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
          {displayArticles.length} 記事
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {displayArticles.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              記事が見つかりません
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {displayArticles.map((article) => (
              <ListItem key={article.id} disablePadding>
                <Paper
                  elevation={0}
                  sx={{
                    width: '100%',
                    borderBottom: 1,
                    borderColor: 'divider',
                    borderRadius: 0,
                  }}
                >
                  <ListItemButton
                    onClick={() => onArticleSelect(article)}
                    sx={{
                      alignItems: 'flex-start',
                      py: 1.5,
                      px: 2,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                lineHeight: 1.2,
                                mb: 0.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {article.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                fontSize: '0.8125rem',
                                lineHeight: 1.3,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mb: 1,
                              }}
                            >
                              {article.description}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flexWrap: 'wrap',
                              }}
                            >
                              <Chip
                                label={article.feedTitle}
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 20,
                                  fontSize: '0.6875rem',
                                  '& .MuiChip-label': {
                                    px: 1,
                                  },
                                }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontSize: '0.6875rem' }}
                              >
                                {formatDate(article.publishedAt || article.createdAt)}
                              </Typography>
                            </Box>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={(e) => handleToggleFavorite(article.id, e)}
                            sx={{ mt: 0.5 }}
                          >
                            {isArticleFavorite(article.id) ? (
                              <Star fontSize="small" color="primary" />
                            ) : (
                              <StarBorder fontSize="small" />
                            )}
                          </IconButton>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </Paper>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default ArticleList;