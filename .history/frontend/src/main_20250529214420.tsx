import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00e6e6' }, // neon cyan
    secondary: { main: '#ff2e88' }, // hot pink
    background: { default: '#181c24', paper: 'rgba(24,28,36,0.85)' },
    success: { main: '#00ff99' }, // neon green
    error: { main: '#ff1744' },
    warning: { main: '#ffea00' },
    info: { main: '#2979ff' },
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: 'Poppins, Inter, Roboto, Arial, sans-serif',
    h4: { fontWeight: 700, letterSpacing: 1 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
); 