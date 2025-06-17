import React, { useState } from 'react';
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

interface FeedManagerProps {
  open: boolean;
  onClose: () => void;
}

const FeedManager: React.FC<FeedManagerProps> = ({ open, onClose }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { addFeed, categories } = useFeed();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('URLが必要です');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addFeed(url.trim(), title.trim(), category);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'フィードの追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setTitle('');
    setCategory('General');
    setError('');
    setLoading(false);
    onClose();
  };

  const existingCategories = categories.map(cat => cat.name);
  const allCategories = [...new Set(['General', ...existingCategories])];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: '1.1rem' }}>RSSフィード追加</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <Alert severity="error" sx={{ fontSize: '0.875rem' }}>
                {error}
              </Alert>
            )}
            
            <TextField
              label="RSSフィードURL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/rss"
              required
              disabled={loading}
              size="small"
              InputLabelProps={{ style: { fontSize: '0.875rem' } }}
              InputProps={{ style: { fontSize: '0.875rem' } }}
            />

            <TextField
              label="フィードタイトル（任意）"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="空欄の場合は自動検出されます"
              disabled={loading}
              size="small"
              InputLabelProps={{ style: { fontSize: '0.875rem' } }}
              InputProps={{ style: { fontSize: '0.875rem' } }}
            />

            <FormControl size="small" disabled={loading}>
              <InputLabel sx={{ fontSize: '0.875rem' }}>カテゴリ</InputLabel>
              <Select
                value={category}
                label="カテゴリ"
                onChange={(e) => setCategory(e.target.value)}
                sx={{ fontSize: '0.875rem' }}
              >
                {allCategories.map((cat) => (
                  <MenuItem key={cat} value={cat} sx={{ fontSize: '0.875rem' }}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="新しいカテゴリを作成"
              placeholder="新しいカテゴリ名を入力"
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
              size="small"
              InputLabelProps={{ style: { fontSize: '0.875rem' } }}
              InputProps={{ style: { fontSize: '0.875rem' } }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={loading} size="small">
キャンセル
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !url.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : null}
            size="small"
          >
            {loading ? '追加中...' : 'フィード追加'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FeedManager;