import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, Button, Container } from '@mui/material';
import ReceiptsPage from './pages/ReceiptsPage';
import FriendsPage from './pages/FriendsPage';
import NotFoundPage from './pages/NotFoundPage';

const navItems = [
  { text: 'Receipts', path: '/' },
  { text: 'Friends', path: '/friends' },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ minHeight: '100vh', background: '#f4f6fb' }}>
      <AppBar position="static" elevation={0} sx={{ background: 'linear-gradient(90deg, #1976d2 0%, #7c4dff 100%)', boxShadow: '0 4px 32px 0 rgba(44,62,80,0.08)' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 1 }}>
            OurCheckSplitter
          </Typography>
          <Box>
            {navItems.map((item) => (
              <Button
                key={item.text}
                color="inherit"
                onClick={() => navigate(item.path)}
                sx={{
                  mx: 1,
                  fontWeight: location.pathname === item.path ? 700 : 400,
                  borderBottom: location.pathname === item.path ? '2px solid #fff' : '2px solid transparent',
                  borderRadius: 0,
                  transition: 'border 0.2s',
                }}
              >
                {item.text}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Routes>
          <Route path="/" element={<ReceiptsPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Container>
    </Box>
  );
} 