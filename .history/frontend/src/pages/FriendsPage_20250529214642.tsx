import React from 'react';
import { List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Fab from '@mui/material/Fab';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const mockFriends = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
];

const avatarColors = ['#1976d2', '#7c4dff', '#26a69a'];

export default function FriendsPage() {
  const [open, setOpen] = React.useState(false);
  const [friends, setFriends] = React.useState(mockFriends);
  const [newName, setNewName] = React.useState('');

  const handleAdd = () => {
    if (!newName) return;
    setFriends([...friends, { id: friends.length + 1, name: newName }]);
    setNewName('');
    setOpen(false);
  };

  return (
    <Box sx={{ position: 'relative', minHeight: 400 }}>
      <Typography variant="h4" gutterBottom color="secondary" sx={{ fontWeight: 900, letterSpacing: 2, color: '#ff2e88', textShadow: '0 2px 16px #ff2e88' }}>Friends</Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ color: '#00e6e6', mb: 3, fontWeight: 600, fontSize: 20 }}>
        Your bill-splitting crew.
      </Typography>
      <List sx={{
        borderRadius: 6,
        boxShadow: '0 8px 32px 0 #ff2e88, 0 2px 32px 0 #00e6e6',
        background: 'rgba(24,28,36,0.85)',
        border: '2px solid',
        borderImage: 'linear-gradient(90deg, #ff2e88 0%, #00e6e6 100%) 1',
        maxWidth: 480,
        mx: 'auto',
        mb: 6,
        p: 2,
      }}>
        {friends.map((friend, idx) => (
          <ListItem key={friend.id} sx={{
            borderRadius: 3,
            transition: 'background 0.18s, transform 0.18s',
            '&:hover': {
              background: 'rgba(0,230,230,0.10)',
              transform: 'scale(1.03) rotate(-1deg)',
            },
          }}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: avatarColors[idx % avatarColors.length], color: '#fff', fontWeight: 700, boxShadow: '0 0 12px #00e6e6' }}>
                {friend.name[0]}
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={<span style={{ fontWeight: 700, fontSize: 20 }}>{friend.name}</span>} />
          </ListItem>
        ))}
      </List>
      <Fab color="secondary" aria-label="add" sx={{
        position: 'absolute',
        bottom: -32,
        right: 24,
        boxShadow: '0 0 24px 8px #ff2e88, 0 0 32px 8px #00e6e6',
        background: 'linear-gradient(90deg, #ff2e88 0%, #00e6e6 100%)',
        color: '#fff',
        fontWeight: 900,
        animation: 'bounce 1.2s infinite',
        '@keyframes bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      }} onClick={() => setOpen(true)}>
        <AddIcon />
      </Fab>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Friend</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Friend Name"
            fullWidth
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained" color="secondary">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 