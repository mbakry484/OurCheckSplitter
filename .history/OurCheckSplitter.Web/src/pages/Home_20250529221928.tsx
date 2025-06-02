import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Restaurant as RestaurantIcon,
} from '@mui/icons-material';

interface Friend {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  price: number;
  assignedFriends: string[];
}

const Home = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [newFriendName, setNewFriendName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const addFriend = () => {
    if (newFriendName.trim()) {
      setFriends([
        ...friends,
        { id: Date.now().toString(), name: newFriendName.trim() },
      ]);
      setNewFriendName('');
    }
  };

  const removeFriend = (id: string) => {
    setFriends(friends.filter((friend) => friend.id !== id));
  };

  const addItem = () => {
    if (newItemName.trim() && newItemPrice) {
      setItems([
        ...items,
        {
          id: Date.now().toString(),
          name: newItemName.trim(),
          price: parseFloat(newItemPrice),
          assignedFriends: [],
        },
      ]);
      setNewItemName('');
      setNewItemPrice('');
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const toggleFriendAssignment = (itemId: string, friendId: string) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const assignedFriends = item.assignedFriends.includes(friendId)
            ? item.assignedFriends.filter((id) => id !== friendId)
            : [...item.assignedFriends, friendId];
          return { ...item, assignedFriends };
        }
        return item;
      })
    );
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.price, 0);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Split Your Bill
      </Typography>

      <Grid container spacing={3}>
        {/* Friends Section */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Friends
              </Typography>
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Friend's Name"
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addFriend()}
                />
                <IconButton
                  color="primary"
                  onClick={addFriend}
                  sx={{ ml: 1 }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              <List>
                {friends.map((friend) => (
                  <ListItem key={friend.id}>
                    <ListItemText primary={friend.name} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => removeFriend(friend.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Items Section */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <RestaurantIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Items
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Item Name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
                <TextField
                  size="small"
                  label="Price"
                  type="number"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  sx={{ width: '120px' }}
                />
                <IconButton color="primary" onClick={addItem}>
                  <AddIcon />
                </IconButton>
              </Box>
              <List>
                {items.map((item) => (
                  <Paper
                    key={item.id}
                    elevation={0}
                    sx={{ mb: 2, p: 2, bgcolor: 'grey.50' }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1">
                        {item.name} - ${item.price.toFixed(2)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => removeItem(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {friends.map((friend) => (
                        <Button
                          key={friend.id}
                          variant={
                            item.assignedFriends.includes(friend.id)
                              ? 'contained'
                              : 'outlined'
                          }
                          size="small"
                          onClick={() => toggleFriendAssignment(item.id, friend.id)}
                        >
                          {friend.name}
                        </Button>
                      ))}
                    </Box>
                  </Paper>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Typography variant="h5" align="right">
                Total: ${calculateTotal().toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home; 