import React, { useState } from 'react';

interface Friend {
  name: string;
}

const FriendForm: React.FC = () => {
  const [friend, setFriend] = useState<Friend>({
    name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(friend),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Friend created:', data);
        alert('Friend created successfully!');
      } else {
        alert('Failed to create friend');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating friend');
    }
  };

  return (
    <div className="form-container">
      <h2>Add Friend</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={friend.name}
            onChange={(e) => setFriend({ ...friend, name: e.target.value })}
          />
        </div>
        <button type="submit">Add Friend</button>
      </form>
    </div>
  );
};

export default FriendForm; 