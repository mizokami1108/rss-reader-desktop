import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Select,
  MenuItem,
  FormControl,
  Switch,
  FormControlLabel,
  LinearProgress,
  Paper,
  Slide,
  Backdrop,
} from '@mui/material';
import {
  Close,
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Refresh,
  OpenInNew,
} from '@mui/icons-material';
import { Article } from '../../../shared/types';
import { useFeed } from '../../contexts/FeedContext';

interface AutoViewerProps {
  open: boolean;
  onClose: () => void;
  articles: Article[];
}

const AutoViewer: React.FC<AutoViewerProps> = ({ open, onClose, articles }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(5000); // 5秒
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [showArticle, setShowArticle] = useState(true);

  const { refreshAllFeeds } = useFeed();

  const currentArticle = articles[currentIndex];

  // プログレスバーの管理
  useEffect(() => {
    if (!isPlaying || !open) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextArticle();
          return 0;
        }
        return prev + (100 / (speed / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, speed, open, currentIndex]);

  // 記事切り替えアニメーション
  const switchArticle = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= articles.length) return;
    
    setShowArticle(false);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setProgress(0);
      setShowArticle(true);
    }, 300);
  }, [articles.length]);

  const nextArticle = useCallback(async () => {
    const nextIndex = currentIndex + 1;
    
    if (nextIndex >= articles.length) {
      // 最後の記事に到達
      if (autoRefreshEnabled && !isRefreshing) {
        await performAutoRefresh();
        return;
      } else {
        // 最初に戻る
        switchArticle(0);
      }
    } else {
      switchArticle(nextIndex);
    }
  }, [currentIndex, articles.length, autoRefreshEnabled, isRefreshing, switchArticle]);

  const previousArticle = useCallback(() => {
    const prevIndex = currentIndex === 0 ? articles.length - 1 : currentIndex - 1;
    switchArticle(prevIndex);
  }, [currentIndex, articles.length, switchArticle]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
    setProgress(0);
  }, [isPlaying]);

  const performAutoRefresh = async () => {
    setIsRefreshing(true);
    setIsPlaying(false);
    setRefreshMessage('フィードを更新中...');

    try {
      // 直接electronAPIを呼び出してRSSフィードを更新
      await window.electronAPI.refreshAllFeeds();
      
      // FeedContextのrefreshAllFeedsも呼び出してUIを更新
      await refreshAllFeeds();
      
      setRefreshMessage('✨ 最新化しました');
      
      setTimeout(() => {
        setIsRefreshing(false);
        setRefreshMessage('');
        setCurrentIndex(0);
        setProgress(0);
        setIsPlaying(true);
      }, 1500);
    } catch (error) {
      console.error('RSS更新エラー:', error);
      setRefreshMessage('❌ 更新に失敗しました');
      setTimeout(() => {
        setIsRefreshing(false);
        setRefreshMessage('');
        setCurrentIndex(0);
        setProgress(0);
        setIsPlaying(true);
      }, 2500);
    }
  };

  // キーボードショートカット
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previousArticle();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextArticle();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, togglePlayPause, previousArticle, nextArticle, onClose]);

  // 設定の読み込み
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('🔍 AutoViewer: 設定読み込み開始');
        console.log('Available electronAPI methods:', Object.keys(window.electronAPI || {}));
        if (window.electronAPI && window.electronAPI.getAutoViewerSpeed) {
          const savedSpeed = await window.electronAPI.getAutoViewerSpeed();
          console.log('✅ 保存された速度設定:', savedSpeed);
          setSpeed(savedSpeed);
        } else {
          console.warn('⚠️ getAutoViewerSpeed method not available, using default speed');
        }
      } catch (error) {
        console.error('❌ Auto Viewer設定の読み込みに失敗:', error);
      }
    };
    
    if (open) {
      loadSettings();
    }
  }, [open]);

  // 初期化
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setProgress(0);
      setShowArticle(true);
    }
  }, [open]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!open || articles.length === 0) return null;

  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: 9999,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* ヘッダー */}
        <Box
          sx={{
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            📰 Auto RSS Viewer
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* 自動更新トグル */}
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefreshEnabled}
                  onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#9f7aea',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#9f7aea',
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem' }}>
                  自動更新
                </Typography>
              }
            />

            {/* プレイ/ポーズ */}
            <Button
              variant="outlined"
              onClick={togglePlayPause}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                backgroundColor: isPlaying ? 'transparent' : '#9f7aea',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
              startIcon={isPlaying ? <Pause /> : <PlayArrow />}
            >
              {isPlaying ? '一時停止' : '再生'}
            </Button>

            {/* 速度選択 */}
            <FormControl size="small">
              <Select
                value={speed}
                onChange={async (e) => {
                  const newSpeed = Number(e.target.value);
                  setSpeed(newSpeed);
                  try {
                    if (window.electronAPI && window.electronAPI.setAutoViewerSpeed) {
                      await window.electronAPI.setAutoViewerSpeed(newSpeed);
                    } else {
                      console.warn('setAutoViewerSpeed method not available');
                    }
                  } catch (error) {
                    console.error('Auto Viewer設定の保存に失敗:', error);
                  }
                }}
                MenuProps={{
                  disablePortal: false,
                  container: document.body,
                  PaperProps: {
                    sx: {
                      bgcolor: 'rgba(0,0,0,0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                      zIndex: '99999 !important',
                      position: 'fixed',
                      maxHeight: 200,
                      '& .MuiMenuItem-root': {
                        color: 'white',
                        fontSize: '0.875rem',
                        padding: '8px 16px',
                        minHeight: 'auto',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.1)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(159,122,234,0.3)',
                          '&:hover': {
                            backgroundColor: 'rgba(159,122,234,0.4)',
                          },
                        },
                      },
                    },
                  },
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                  slotProps: {
                    root: {
                      style: { zIndex: 99999 }
                    }
                  }
                }}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'white',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#9f7aea',
                  },
                }}
              >
                <MenuItem value={8000}>遅い (8秒)</MenuItem>
                <MenuItem value={5000}>普通 (5秒)</MenuItem>
                <MenuItem value={3000}>速い (3秒)</MenuItem>
                <MenuItem value={2000}>高速 (2秒)</MenuItem>
              </Select>
            </FormControl>

            {/* 手動更新 */}
            <IconButton
              onClick={() => performAutoRefresh()}
              disabled={isRefreshing}
              sx={{ color: 'white' }}
            >
              <Refresh />
            </IconButton>

            {/* 終了 */}
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* メインコンテンツ */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            position: 'relative',
          }}
        >
          {/* 記事表示 */}
          <Slide direction="up" in={showArticle && !isRefreshing} timeout={600}>
            <Paper
              elevation={24}
              sx={{
                maxWidth: 800,
                width: '100%',
                p: 5,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}
            >
              {currentArticle && (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      fontSize: '0.875rem',
                      color: 'text.secondary',
                    }}
                  >
                    <Typography variant="body2">
                      📰 {currentArticle.feedTitle}
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(currentArticle.publishedAt || currentArticle.createdAt)}
                    </Typography>
                  </Box>

                  <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                      fontWeight: 700,
                      color: 'primary.main',
                      mb: 2,
                      lineHeight: 1.4,
                      fontSize: { xs: '1.5rem', md: '1.8rem' },
                    }}
                  >
                    {currentArticle.title}
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: '1.1rem',
                      lineHeight: 1.8,
                      color: 'text.secondary',
                      mb: 3,
                    }}
                  >
                    {currentArticle.description}
                  </Typography>

                  <Button
                    variant="outlined"
                    href={currentArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<OpenInNew />}
                    sx={{ fontWeight: 500 }}
                  >
                    📖 記事を読む
                  </Button>
                </>
              )}
            </Paper>
          </Slide>

          {/* 更新状況表示 */}
          {isRefreshing && (
            <Paper
              elevation={8}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                p: 4,
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                textAlign: 'center',
                borderRadius: 3,
                zIndex: 10001,
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    border: '3px solid rgba(255,255,255,0.3)',
                    borderTop: '3px solid #9f7aea',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              </Box>
              <Typography variant="body1">{refreshMessage}</Typography>
            </Paper>
          )}
        </Box>

        {/* フッター */}
        <Box
          sx={{
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
            {currentIndex + 1} / {articles.length} 記事
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={previousArticle}
              sx={{ color: 'white' }}
              size="small"
            >
              <SkipPrevious />
            </IconButton>
            <IconButton
              onClick={nextArticle}
              sx={{ color: 'white' }}
              size="small"
            >
              <SkipNext />
            </IconButton>
          </Box>

          {/* プログレスバー */}
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'transparent',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #9f7aea 0%, #667eea 100%)',
              },
            }}
          />
        </Box>
      </Box>
    </Backdrop>
  );
};

export default AutoViewer;