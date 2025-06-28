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
import { Article, RefreshProgressData } from '../../../shared/types';
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
  const [refreshProgress, setRefreshProgress] = useState<RefreshProgressData | null>(null);
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
    setRefreshProgress(null);

    try {
      // 直接electronAPIを呼び出してRSSフィードを更新（プログレス付き）
      await window.electronAPI.refreshAllFeeds();
      
      // FeedContextのrefreshAllFeedsも呼び出してUIを更新
      await refreshAllFeeds();
      
      // プログレス監視のuseEffectで完了処理が行われるため、ここでは何もしない
    } catch (error) {
      console.error('RSS更新エラー:', error);
      setRefreshMessage('❌ 更新に失敗しました');
      setRefreshProgress(null);
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

  // プログレス監視
  useEffect(() => {
    if (!open) return;

    const unsubscribe = window.electronAPI.onRefreshProgress((data: RefreshProgressData) => {
      setRefreshProgress(data);
      
      if (data.step === 'completed') {
        setRefreshMessage(data.message);
        setTimeout(() => {
          setIsRefreshing(false);
          setRefreshMessage('');
          setRefreshProgress(null);
          setCurrentIndex(0);
          setProgress(0);
          setIsPlaying(true);
        }, 2000);
      } else if (data.step === 'error') {
        setRefreshMessage('❌ 更新に失敗しました');
        setRefreshProgress(null);
        setTimeout(() => {
          setIsRefreshing(false);
          setRefreshMessage('');
          setCurrentIndex(0);
          setProgress(0);
          setIsPlaying(true);
        }, 2500);
      } else {
        setRefreshMessage(data.message);
      }
    });

    return () => {
      unsubscribe();
    };
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
            px: 2,
            py: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: '60px',
          }}
        >
          <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>
            📰 Auto RSS Viewer
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* 自動更新トグル */}
            <FormControlLabel
              control={
                <Switch
                  size="small"
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
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem' }}>
                  自動更新
                </Typography>
              }
              sx={{ mr: 0 }}
            />

            {/* プレイ/ポーズ */}
            <Button
              variant="outlined"
              size="small"
              onClick={togglePlayPause}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                backgroundColor: isPlaying ? 'transparent' : '#9f7aea',
                fontSize: '0.75rem',
                minWidth: '80px',
                py: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
              startIcon={isPlaying ? <Pause sx={{ fontSize: '1rem' }} /> : <PlayArrow sx={{ fontSize: '1rem' }} />}
            >
              {isPlaying ? '停止' : '再生'}
            </Button>

            {/* 速度選択 */}
            <FormControl size="small" sx={{ minWidth: '80px' }}>
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
                        fontSize: '0.75rem',
                        padding: '6px 12px',
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
                  fontSize: '0.75rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'white',
                    fontSize: '1rem',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#9f7aea',
                  },
                }}
              >
                <MenuItem value={8000}>8秒</MenuItem>
                <MenuItem value={5000}>5秒</MenuItem>
                <MenuItem value={3000}>3秒</MenuItem>
                <MenuItem value={2000}>2秒</MenuItem>
              </Select>
            </FormControl>

            {/* 手動更新 */}
            <IconButton
              size="small"
              onClick={() => performAutoRefresh()}
              disabled={isRefreshing}
              sx={{ color: 'white', p: 1 }}
            >
              <Refresh sx={{ fontSize: '1.2rem' }} />
            </IconButton>

            {/* 終了 */}
            <IconButton size="small" onClick={onClose} sx={{ color: 'white', p: 1 }}>
              <Close sx={{ fontSize: '1.2rem' }} />
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
            p: 2,
            position: 'relative',
            minHeight: 0, // フレックスアイテムが縮小可能に
          }}
        >
          {/* 記事表示 */}
          <Slide direction="up" in={showArticle && !isRefreshing} timeout={600}>
            <Paper
              elevation={24}
              sx={{
                maxWidth: { xs: '100%', sm: '600px', md: '700px', lg: '800px' },
                width: '100%',
                maxHeight: 'calc(100vh - 140px)', // ヘッダーとフッターを除いた高さ
                overflow: 'hidden', // オーバーフローを隠す
                p: { xs: 2, sm: 3 }, // 小さい画面ではパディングを減らす
                borderRadius: 3,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                mx: 'auto', // 中央寄せ
              }}
            >
              {currentArticle && (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1.5,
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                      📰 {currentArticle.feedTitle}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                      {formatDate(currentArticle.publishedAt || currentArticle.createdAt)}
                    </Typography>
                  </Box>

                  {/* レスポンシブ画像とタイトル表示 */}
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1.5,
                      mb: 1.5,
                      flexDirection: { xs: 'row', sm: 'column' }, // 小さい画面では横並び、大きい画面では縦並び
                      alignItems: { xs: 'flex-start', sm: 'stretch' },
                    }}
                  >
                    {currentArticle.imageUrl && (
                      <Box
                        sx={{
                          flexShrink: 0,
                          borderRadius: 2,
                          overflow: 'hidden',
                          backgroundColor: 'grey.100',
                          border: '1px solid',
                          borderColor: 'divider',
                          // 小さい画面では左側に配置、大きい画面では上部に配置
                          width: { xs: 70, sm: '100%' },
                          height: { xs: 50, sm: 'auto' },
                          maxHeight: { xs: 50, sm: 200 },
                          order: { xs: 1, sm: 2 }, // 小さい画面では先に表示
                        }}
                      >
                        <img
                          src={currentArticle.imageUrl}
                          alt={currentArticle.title}
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

                    <Typography
                      variant="h5"
                      component="h1"
                      sx={{
                        fontWeight: 600,
                        color: 'primary.main',
                        lineHeight: 1.3,
                        fontSize: '1.25rem',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: { xs: 2, sm: 3 }, // 小さい画面では2行、大きい画面では3行
                        WebkitBoxOrient: 'vertical',
                        flex: 1,
                        order: { xs: 2, sm: 1 }, // 小さい画面では後に表示
                      }}
                    >
                      {currentArticle.title}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      lineHeight: 1.6,
                      color: 'text.secondary',
                      mb: 2,
                      flex: 1,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: { xs: 4, sm: 6 }, // 小さい画面では4行、大きい画面では6行まで
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {currentArticle.description}
                  </Typography>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={async () => {
                      try {
                        await window.electronAPI.openExternalLink(currentArticle.url);
                      } catch (error) {
                        console.error('Failed to open external link:', error);
                        // フォールバック: 従来の方法で開く
                        window.open(currentArticle.url, '_blank');
                      }
                    }}
                    startIcon={<OpenInNew sx={{ fontSize: '1rem' }} />}
                    sx={{ 
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      py: 0.5,
                      alignSelf: 'flex-start',
                    }}
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
              {refreshProgress ? (
                <Box sx={{ mb: 2, minWidth: 250 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {refreshProgress.message}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={refreshProgress.progress} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: '#9f7aea',
                      }
                    }} 
                  />
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    {refreshProgress.current}/{refreshProgress.total} フィード ({refreshProgress.progress}%)
                  </Typography>
                </Box>
              ) : (
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
              )}
              <Typography variant="body1">{refreshMessage}</Typography>
            </Paper>
          )}
        </Box>

        {/* フッター */}
        <Box
          sx={{
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            px: 2,
            py: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            minHeight: '50px',
          }}
        >
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>
            {currentIndex + 1} / {articles.length}
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              onClick={previousArticle}
              sx={{ color: 'white', p: 1 }}
              size="small"
            >
              <SkipPrevious sx={{ fontSize: '1.2rem' }} />
            </IconButton>
            <IconButton
              onClick={nextArticle}
              sx={{ color: 'white', p: 1 }}
              size="small"
            >
              <SkipNext sx={{ fontSize: '1.2rem' }} />
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