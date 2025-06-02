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
      <Typography variant="h4" gutterBottom color="secondary">Friends</Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ color: '#1976d2', mb: 3 }}>
        Your bill-splitting crew.
      </Typography>
      <List sx={{
        borderRadius: 5,
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
        background: 'rgba(255,255,255,0.35)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.18)',
        maxWidth: 480,
        mx: 'auto',
        mb: 6,
        p: 2,
      }}>
        {friends.map((friend, idx) => (
          <ListItem key={friend.id} sx={{
            borderRadius: 3,
            transition: 'background 0.15s',
            '&:hover': { background: 'rgba(124,77,255,0.08)' },
          }}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: avatarColors[idx % avatarColors.length] }}>
                {friend.name[0]}
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={friend.name} />
          </ListItem>
        ))}
      </List>
      <Fab color="secondary" aria-label="add" sx={{ position: 'absolute', bottom: -32, right: 24, boxShadow: 4 }} onClick={() => setOpen(true)}>
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