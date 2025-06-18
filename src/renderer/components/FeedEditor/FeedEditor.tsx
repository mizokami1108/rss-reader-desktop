import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useFeed } from '../../contexts/FeedContext';
import { RSSFeed } from '../../../shared/types';

interface FeedEditorProps {
  open: boolean;
  onClose: () => void;
  feed: RSSFeed | null;
}

const FeedEditor: React.FC<FeedEditorProps> = ({ open, onClose, feed }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { updateFeed, categories } = useFeed();

  // フィード情報を初期値として設定
  useEffect(() => {
    if (feed && open) {
      setUrl(feed.url);
      setTitle(feed.title);
      setCategory(feed.category);
      setNewCategory('');
      setError('');
    }
  }, [feed, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feed) return;
    
    if (!url.trim()) {
      setError('URLが必要です');
      return;
    }

    if (!title.trim()) {
      setError('タイトルが必要です');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedCategory = newCategory.trim() || category;
      await updateFeed(feed.id, {
        url: url.trim(),
        title: title.trim(),
        category: selectedCategory,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'フィードの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setTitle('');
    setCategory('General');
    setNewCategory('');
    setError('');
    onClose();
  };

  if (!feed) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          📝 フィードを編集
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            
            {/* RSS フィード URL */}
            <TextField
              label="RSS フィード URL"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/rss.xml"
              required
              fullWidth
              disabled={loading}
            />
            
            {/* フィードタイトル */}
            <TextField
              label="フィードタイトル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトルを入力してください"
              required
              fullWidth
              disabled={loading}
            />
            
            {/* カテゴリ選択 */}
            <FormControl fullWidth disabled={loading}>
              <InputLabel>カテゴリ</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label="カテゴリ"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.name} value={cat.name}>
                    {cat.name} ({cat.count})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* 新しいカテゴリ */}
            <TextField
              label="新しいカテゴリ（任意）"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="新しいカテゴリ名を入力"
              fullWidth
              disabled={loading}
              helperText="入力すると新しいカテゴリが作成されます"
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            キャンセル
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? '更新中...' : '更新'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FeedEditor;