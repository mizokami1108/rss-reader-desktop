import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  Divider,
  Button,
} from '@mui/material';
import { ArrowBack, Star, StarBorder, OpenInNew } from '@mui/icons-material';
import { Article } from '../../../shared/types';
import { useFeed } from '../../contexts/FeedContext';

interface ArticleReaderProps {
  article: Article;
  onBack: () => void;
}

const ArticleReader: React.FC<ArticleReaderProps> = ({ article, onBack }) => {
  const { favorites, toggleFavorite } = useFeed();

  const isArticleFavorite = (articleId: number) => {
    return favorites.some(fav => fav.id === articleId);
  };

  const handleToggleFavorite = async () => {
    await toggleFavorite(article.id);
  };

  const handleOpenExternal = async () => {
    if (article.url) {
      try {
        await window.electronAPI.openExternalLink(article.url);
      } catch (error) {
        console.error('Failed to open external link:', error);
        // フォールバック: 従来の方法で開く
        window.open(article.url, '_blank');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '不明';
    }
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const cleanContent = (content: string) => {
    if (!content) return '';
    
    // Basic HTML cleaning - in a real app, you'd want to use a proper sanitizer
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <IconButton onClick={onBack} size="small">
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 500, flex: 1 }}>
          記事リーダー
        </Typography>
        <IconButton onClick={handleToggleFavorite} size="small">
          {isArticleFavorite(article.id) ? (
            <Star color="primary" />
          ) : (
            <StarBorder />
          )}
        </IconButton>
        <Button
          variant="outlined"
          size="small"
          startIcon={<OpenInNew />}
          onClick={handleOpenExternal}
          disabled={!article.url}
        >
          元記事を開く
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Paper elevation={0} sx={{ maxWidth: 800, mx: 'auto' }}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontSize: '1.5rem',
                fontWeight: 600,
                lineHeight: 1.2,
                mb: 2,
              }}
            >
              {article.title}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
                flexWrap: 'wrap',
              }}
            >
              <Chip
                label={article.feedTitle}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
              {article.feedCategory && (
                <Chip
                  label={article.feedCategory}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.8125rem' }}
              >
                公開日 {formatDate(article.publishedAt || article.createdAt)}
              </Typography>
            </Box>

            {article.description && (
              <>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  sx={{
                    fontSize: '1rem',
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                    mb: 2,
                  }}
                >
                  {article.description}
                </Typography>
                <Divider sx={{ my: 2 }} />
              </>
            )}
          </Box>

          <Box sx={{ typography: 'body1' }}>
            {article.content ? (
              <div
                style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {cleanContent(article.content)}
              </div>
            ) : (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontSize: '0.9375rem', fontStyle: 'italic' }}
              >
                コンテンツがありません。完全な記事を読むには「元記事を開く」をクリックしてください。
              </Typography>
            )}
          </Box>

          {article.url && (
            <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.75rem' }}
              >
                ソース: {new URL(article.url).hostname}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ArticleReader;