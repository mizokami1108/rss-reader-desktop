import React, { useState } from 'react';
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
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Star, StarBorder, ViewList, ViewModule } from '@mui/icons-material';
import { useFeed } from '../../contexts/FeedContext';
import { Article } from '../../../shared/types';

interface ArticleListProps {
  onArticleSelect: (article: Article) => void;
}

const ArticleList: React.FC<ArticleListProps> = ({ onArticleSelect }) => {
  const { articles, favorites, loading, selectedCategory, selectedFeed, toggleFavorite } = useFeed();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: 'list' | 'grid' | null,
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const renderCardView = () => (
    <Box 
      sx={{ 
        p: 2,
        pb: 2, // 下部にパディングを設定（ウィンドウ高さ考慮）
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        justifyContent: 'flex-start',
      }}
    >
      {displayArticles.map((article) => (
        <Card
          key={article.id}
          sx={{
            width: {
              xs: 'calc(100% - 0px)', // 1列 (モバイル)
              sm: 'calc(50% - 8px)',  // 2列 (タブレット)
              md: 'calc(33.333% - 11px)', // 3列 (デスクトップ)
              lg: 'calc(25% - 12px)',  // 4列 (大型画面)
              xl: 'calc(20% - 13px)',  // 5列 (超大型画面)
            },
            height: 300, // 統一した高さに設定
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 4,
            },
          }}
          onClick={() => onArticleSelect(article)}
        >
            {article.imageUrl ? (
              <CardMedia
                component="img"
                height="120"
                image={article.imageUrl}
                alt={article.title}
                sx={{
                  objectFit: 'cover',
                  backgroundColor: 'grey.100',
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.style.backgroundColor = '#f5f5f5';
                  target.parentElement!.style.height = '120px';
                  target.parentElement!.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 120px; color: #999; font-size: 0.8rem; background-color: #f5f5f5;">画像なし</div>';
                }}
              />
            ) : (
              <Box
                sx={{
                  height: 120,
                  backgroundColor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                  fontSize: '0.8rem',
                }}
              >
                画像なし
              </Box>
            )}
            <CardContent sx={{ flex: 1, p: 1.5, display: 'flex', flexDirection: 'column' }}>
              <Typography
                variant="subtitle2"
                component="h3"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  mb: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2, // 統一して2行まで
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  height: '2.4em', // 統一した高さ
                }}
              >
                {article.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: '0.75rem',
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 3, // 統一して3行まで
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  mb: 1,
                  flex: 1,
                  height: '3.9em', // 統一した高さ
                }}
              >
                {article.description}
              </Typography>
            </CardContent>
            <Box
              sx={{
                p: 1,
                pt: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'grey.50',
                mt: 'auto',
              }}
            >
              {/* 左側：カテゴリと投稿日 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                <Chip
                  label={article.feedTitle}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 16,
                    fontSize: '0.5rem',
                    flexShrink: 0,
                    maxWidth: '60%',
                    '& .MuiChip-label': {
                      px: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ 
                    fontSize: '0.5rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatDate(article.publishedAt || article.createdAt)}
                </Typography>
              </Box>
              
              {/* 右側：お気に入りボタン */}
              <IconButton
                size="small"
                onClick={(e) => handleToggleFavorite(article.id, e)}
                sx={{ p: 0.25, flexShrink: 0 }}
              >
                {isArticleFavorite(article.id) ? (
                  <Star sx={{ fontSize: '1rem' }} color="primary" />
                ) : (
                  <StarBorder sx={{ fontSize: '1rem' }} />
                )}
              </IconButton>
            </Box>
          </Card>
      ))}
    </Box>
  );

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
    <Box sx={{ 
      height: 'calc(100vh - 48px)', // ツールバーの高さ(48px)を引く
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden' // 親コンテナがオーバーフローしないように
    }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
            {getListTitle()}
          </Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            aria-label="view mode"
          >
            <ToggleButton value="list" aria-label="list view">
              <ViewList fontSize="small" />
            </ToggleButton>
            <ToggleButton value="grid" aria-label="grid view">
              <ViewModule fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
          {displayArticles.length} 記事
        </Typography>
      </Box>

      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          // カスタムスクロールバー
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.05)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(0,0,0,0.3)',
            },
          },
          '&::-webkit-scrollbar-thumb:active': {
            background: 'rgba(0,0,0,0.4)',
          },
        }}
      >
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
        ) : viewMode === 'grid' ? (
          renderCardView()
        ) : (
          <List disablePadding sx={{ pb: 2 }}>
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
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                          {article.imageUrl && (
                            <Box
                              sx={{
                                flexShrink: 0,
                                width: 80,
                                height: 60,
                                borderRadius: 1,
                                overflow: 'hidden',
                                backgroundColor: 'grey.100',
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              <img
                                src={article.imageUrl}
                                alt={article.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  display: 'block',
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.style.backgroundColor = '#f5f5f5';
                                  target.parentElement!.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 0.75rem;">画像なし</div>';
                                }}
                              />
                            </Box>
                          )}
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