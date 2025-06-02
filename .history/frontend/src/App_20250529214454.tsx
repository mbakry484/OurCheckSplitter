import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, IconButton, Container, Tooltip } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import GroupIcon from '@mui/icons-material/Group';
import ReceiptsPage from './pages/ReceiptsPage';
import FriendsPage from './pages/FriendsPage';
import NotFoundPage from './pages/NotFoundPage';

const navItems = [
  { text: 'Receipts', path: '/', icon: <ReceiptLongIcon fontSize="large" /> },
  { text: 'Friends', path: '/friends', icon: <GroupIcon fontSize="large" /> },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #181c24 0%, #232946 100%)' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: 'linear-gradient(90deg, #00e6e6 0%, #ff2e88 100%)',
          boxShadow: '0 0 32px 0 #00e6e6, 0 2px 32px 0 #ff2e88',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img src="https://fonts.gstatic.com/s/i/materialiconsoutlined/receipt_long/v15/24px.svg" alt="logo" style={{ height: 32, filter: 'drop-shadow(0 0 8px #00e6e6)' }} />
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 2, color: '#fff', textShadow: '0 2px 16px #00e6e6' }}>
              OurCheckSplitter
            </Typography>
          </Box>
          <Box>
            {navItems.map((item) => (
              <Tooltip title={item.text} key={item.text}>
                <IconButton
                  color={location.pathname === item.path ? 'secondary' : 'inherit'}
                  onClick={() => navigate(item.path)}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    background: location.pathname === item.path ? 'rgba(255,46,136,0.12)' : 'transparent',
                    boxShadow: location.pathname === item.path ? '0 0 12px #ff2e88' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {item.icon}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Routes>
          <Route path="/" element={<ReceiptsPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Container>
    </Box>
  );
} 