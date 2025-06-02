import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, List, ListItem, CircularProgress, Box, Alert } from '@mui/material';
import * as api from '../api';

const FriendsPage = () => {
  const [friends, setFriends] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFriends() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getFriends();
        setFriends(data);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch friends');
      } finally {
        setLoading(false);
      }
    }
    fetchFriends();
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Friends in Database
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <List>
            {friends.map(friend => (
              <ListItem key={friend.id}>{friend.name}</ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default FriendsPage; 