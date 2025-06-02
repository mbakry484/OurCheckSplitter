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
    <Box>
      <Typography variant="h4" gutterBottom color="secondary">Friends</Typography>
      <List>
        {friends.map((friend, idx) => (
          <ListItem key={friend.id}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: avatarColors[idx % avatarColors.length] }}>
                {friend.name[0]}
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={friend.name} />
          </ListItem>
        ))}
      </List>
      <Fab color="secondary" aria-label="add" sx={{ position: 'fixed', bottom: 32, right: 32, boxShadow: 4 }} onClick={() => setOpen(true)}>
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