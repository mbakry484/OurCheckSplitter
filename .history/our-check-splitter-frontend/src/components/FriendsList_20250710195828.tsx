import React, { useState, useEffect } from 'react';

interface Friend {
  id: number;
  name: string;
}

const FriendsList: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [newFriendName, setNewFriendName] = useState('');

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/Friends');
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const addFriend = async () => {
    if (!newFriendName.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/api/Friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newFriendName }),
      });

      if (response.ok) {
        setNewFriendName('');
        fetchFriends();
      }
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  const deleteFriend = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/Friends?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchFriends();
      }
    } catch (error) {
      console.error('Error deleting friend:', error);
    }
  };

  return (
    <div className="friends-list">
      <h2>Friends</h2>
      <div className="add-friend">
        <input
          type="text"
          value={newFriendName}
          onChange={(e) => setNewFriendName(e.target.value)}
          placeholder="Enter friend's name"
        />
        <button onClick={addFriend}>Add Friend</button>
      </div>
      <ul>
        {friends.map((friend) => (
          <li key={friend.id}>
            {friend.name}
            <button onClick={() => deleteFriend(friend.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FriendsList; 