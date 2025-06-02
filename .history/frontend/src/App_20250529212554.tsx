import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Box, CssBaseline, IconButton } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import GroupIcon from '@mui/icons-material/Group';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import ReceiptsPage from './pages/ReceiptsPage';
import FriendsPage from './pages/FriendsPage';
import NotFoundPage from './pages/NotFoundPage';

const drawerWidth = 220;

const navItems = [
  { text: 'Receipts', icon: <ReceiptLongIcon color="primary" />, path: '/' },
  { text: 'Friends', icon: <GroupIcon color="secondary" />, path: '/friends' },
];

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const drawer = (
    <div>
      <Toolbar />
      <List>
        {navItems.map((item) => (
          <ListItem button key={item.text} component={Link} to={item.path} selected={location.pathname === item.path} onClick={() => setMobileOpen(false)}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, background: 'linear-gradient(90deg, #1976d2 0%, #7c4dff 100%)' }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            OurCheckSplitter
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, minHeight: '100vh', background: '#f4f6fb' }}>
        <Toolbar />
        <Routes>
          <Route path="/" element={<ReceiptsPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Box>
    </Box>
  );
} 