import { useState, useEffect } from 'react';
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
  Autocomplete,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Restaurant as RestaurantIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import * as api from '../api';

interface Friend {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedFriends: string[];
  subitemAssignments?: string[][]; // Each subitem can have its own friend assignment
}

const Home = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [newFriendName, setNewFriendName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allDbFriends, setAllDbFriends] = useState<{ id: number; name: string }[]>([]);
  const [receiptName, setReceiptName] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);
      try {
        // Fetch receipts
        const receipts = await api.getReceipts();
        let receipt = receipts[0];
        if (!receipt) {
          // Create a new receipt if none exists
          receipt = await api.createReceipt({ name: 'My Receipt' });
        }
        setReceiptId(receipt.id);
        // Set friends and items from receipt
        setFriends(receipt.friends || []);
        setItems(
          (receipt.items || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            assignedFriends: [], // Will be filled by assignments
            subitemAssignments: undefined, // TODO: map assignments
          }))
        );
        if (receipt && receipt.name) setReceiptName(receipt.name);
      } catch (e: any) {
        setError(e.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function fetchDbFriends() {
      try {
        const data = await api.getFriends();
        setAllDbFriends(data);
      } catch {}
    }
    fetchDbFriends();
  }, []);

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
    if (newItemName.trim() && newItemPrice && newItemQuantity) {
      setItems([
        ...items,
        {
          id: Date.now().toString(),
          name: newItemName.trim(),
          price: parseFloat(newItemPrice),
          quantity: parseInt(newItemQuantity, 10),
          assignedFriends: [],
          subitemAssignments: undefined,
        },
      ]);
      setNewItemName('');
      setNewItemPrice('');
      setNewItemQuantity('1');
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const toggleExpandItem = (itemId: string) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  const toggleSubitemFriendAssignment = (itemId: string, subIndex: number, friendId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        let subitemAssignments = item.subitemAssignments || Array(item.quantity).fill([]).map(() => []);
        const assigned = subitemAssignments[subIndex] || [];
        subitemAssignments = [...subitemAssignments];
        if (assigned.includes(friendId)) {
          subitemAssignments[subIndex] = assigned.filter(id => id !== friendId);
        } else {
          subitemAssignments[subIndex] = [...assigned, friendId];
        }
        return { ...item, subitemAssignments };
      }
      return item;
    }));
  };

  const toggleFriendAssignment = (itemId: string, friendId: string) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          if (item.subitemAssignments) return item;
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
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // Assign all friends to an item (whole item)
  const assignAllFriendsToItem = (itemId: string) => {
    setItems(items.map(item =>
      item.id === itemId && !item.subitemAssignments
        ? { ...item, assignedFriends: friends.map(f => f.id) }
        : item
    ));
  };

  // Unassign all friends from an item (whole item)
  const unassignAllFriendsFromItem = (itemId: string) => {
    setItems(items.map(item =>
      item.id === itemId && !item.subitemAssignments
        ? { ...item, assignedFriends: [] }
        : item
    ));
  };

  // Assign all friends to a subitem
  const assignAllFriendsToSubitem = (itemId: string, subIndex: number) => {
    setItems(items.map(item => {
      if (item.id === itemId && item.subitemAssignments) {
        const subitemAssignments = [...item.subitemAssignments];
        subitemAssignments[subIndex] = friends.map(f => f.id);
        return { ...item, subitemAssignments };
      }
      return item;
    }));
  };

  // Unassign all friends from a subitem
  const unassignAllFriendsFromSubitem = (itemId: string, subIndex: number) => {
    setItems(items.map(item => {
      if (item.id === itemId && item.subitemAssignments) {
        const subitemAssignments = [...item.subitemAssignments];
        subitemAssignments[subIndex] = [];
        return { ...item, subitemAssignments };
      }
      return item;
    }));
  };

  const handleSubmitReceipt = async () => {
    try {
      await api.createReceipt({ name: receiptName });
      setSubmitSuccess(true);
      setSubmitError(null);
    } catch (e: any) {
      setSubmitError(e.message || 'Failed to submit receipt');
      setSubmitSuccess(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Split Your Bill
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            label="Receipt Name"
            placeholder="Receipt Name"
            value={receiptName}
            onChange={e => setReceiptName(e.target.value)}
            variant="outlined"
            size="small"
            fullWidth
          />
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={handleSubmitReceipt}
            disabled={!receiptName.trim()}
          >
            Submit Receipt
          </Button>
        </CardContent>
      </Card>

      <Snackbar open={submitSuccess} autoHideDuration={3000} onClose={() => setSubmitSuccess(false)}>
        <Alert onClose={() => setSubmitSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Receipt submitted successfully!
        </Alert>
      </Snackbar>
      <Snackbar open={!!submitError} autoHideDuration={4000} onClose={() => setSubmitError(null)}>
        <Alert onClose={() => setSubmitError(null)} severity="error" sx={{ width: '100%' }}>
          {submitError}
        </Alert>
      </Snackbar>

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
                <Autocomplete
                  freeSolo
                  options={allDbFriends.map(f => f.name)}
                  inputValue={newFriendName}
                  onInputChange={(_, value) => setNewFriendName(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      size="small"
                      label="Friend's Name"
                      onKeyPress={(e) => e.key === 'Enter' && addFriend()}
                    />
                  )}
                  sx={{ flex: 1 }}
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
                  sx={{ width: '100px' }}
                />
                <TextField
                  size="small"
                  label="Qty"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                  sx={{ width: '70px' }}
                />
                <IconButton color="primary" onClick={addItem}>
                  <AddIcon />
                </IconButton>
              </Box>
              <List>
                {items.map((item) => {
                  const isExpanded = expandedItemId === item.id;
                  const hasSubitemAssignments = !!item.subitemAssignments;
                  return (
                    <Paper
                      key={item.id}
                      elevation={0}
                      sx={{ mb: 2, p: 2, bgcolor: 'grey.50' }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                        <Typography variant="subtitle1">
                          {item.name} (x{item.quantity}) - ${item.price.toFixed(2)}
                        </Typography>
                        <Box>
                          {item.quantity > 1 && (
                            <IconButton size="small" onClick={() => toggleExpandItem(item.id)}>
                              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => removeItem(item.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      {!hasSubitemAssignments && (
                        <>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 1 }}>
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
                          {friends.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'flex-end' }}>
                              <Button size="small" variant="text" onClick={() => assignAllFriendsToItem(item.id)}>
                                Assign All
                              </Button>
                              <Button size="small" variant="text" onClick={() => unassignAllFriendsFromItem(item.id)}>
                                Unassign All
                              </Button>
                            </Box>
                          )}
                        </>
                      )}
                      {item.quantity > 1 && isExpanded && (
                        <Box sx={{ mt: 2 }}>
                          {[...Array(item.quantity)].map((_, subIdx) => (
                            <Card key={subIdx} sx={{ mb: 1, p: 1, bgcolor: 'grey.100' }}>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {item.name} #{subIdx + 1}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 1 }}>
                                {friends.map((friend) => (
                                  <Button
                                    key={friend.id}
                                    variant={
                                      item.subitemAssignments && item.subitemAssignments[subIdx]?.includes(friend.id)
                                        ? 'contained'
                                        : 'outlined'
                                    }
                                    size="small"
                                    onClick={() => toggleSubitemFriendAssignment(item.id, subIdx, friend.id)}
                                  >
                                    {friend.name}
                                  </Button>
                                ))}
                              </Box>
                              {friends.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'flex-end' }}>
                                  <Button size="small" variant="text" onClick={() => assignAllFriendsToSubitem(item.id, subIdx)}>
                                    Assign All
                                  </Button>
                                  <Button size="small" variant="text" onClick={() => unassignAllFriendsFromSubitem(item.id, subIdx)}>
                                    Unassign All
                                  </Button>
                                </Box>
                              )}
                            </Card>
                          ))}
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ mt: 1 }}
                            onClick={() => {
                              setItems(items.map(it => it.id === item.id ? { ...it, subitemAssignments: undefined } : it));
                            }}
                          >
                            Use whole item assignment instead
                          </Button>
                        </Box>
                      )}
                      {hasSubitemAssignments && !isExpanded && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Assigned to {item.subitemAssignments?.filter(a => a.length > 0).length} subitems
                        </Typography>
                      )}
                      {item.quantity > 1 && !hasSubitemAssignments && !isExpanded && (
                        <Button
                          size="small"
                          variant="text"
                          sx={{ mt: 1, textTransform: 'none' }}
                          onClick={() => {
                            setItems(items.map(it =>
                              it.id === item.id
                                ? { ...it, subitemAssignments: Array(item.quantity).fill([]).map(() => []) }
                                : it
                            ));
                            setExpandedItemId(item.id);
                          }}
                        >
                          Assign friends to each subitem
                        </Button>
                      )}
                    </Paper>
                  );
                })}
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