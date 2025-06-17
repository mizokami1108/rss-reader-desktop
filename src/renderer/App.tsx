import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { ThemeContextProvider } from './contexts/ThemeContext';
import { FeedContextProvider } from './contexts/FeedContext';
import Layout from './components/Layout/Layout';

const App: React.FC = () => {
  return (
    <ThemeContextProvider>
      <FeedContextProvider>
        <Layout />
      </FeedContextProvider>
    </ThemeContextProvider>
  );
};

export default App;