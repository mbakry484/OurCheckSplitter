import React from 'react';
import { List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Box } from '@mui/material';

const mockFriends = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
];

const avatarColors = ['#1976d2', '#7c4dff', '#26a69a'];

export default function FriendsPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom color="secondary">Friends</Typography>
      <List>
        {mockFriends.map((friend, idx) => (
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
    </Box>
  );
} 