import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface Friend {
  id: number;
  name: string;
}

interface ItemAssignment {
  id: number;
  unitlabel: string;
  price: number;
  quantity: number;
  assignedFriends: Friend[];
}

interface Item {
  id: number;
  name: string;
  price: number;
  quantity: number;
  assignments: ItemAssignment[];
}

interface Receipt {
  id: number;
  name: string;
  tax: number;
  tips: number;
  total: number;
  friends: Friend[];
  items: Item[];
}

const ReceiptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const [newItem, setNewItem] = useState({ name: '', price: 0, quantity: 1 });

  useEffect(() => {
    fetchReceipt();
    fetchFriends();
  }, [id]);

  const fetchReceipt = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/Receipt/${id}`);
      const data = await response.json();
      setReceipt(data);
    } catch (error) {
      console.error('Error fetching receipt:', error);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/Friends');
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const addItem = async () => {
    if (!newItem.name || newItem.price <= 0) return;

    try {
      await fetch(`http://localhost:5000/api/Receipt/assign-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptId: id,
          items: [{
            name: newItem.name,
            price: newItem.price,
            quantity: newItem.quantity
          }]
        }),
      });

      setNewItem({ name: '', price: 0, quantity: 1 });
      fetchReceipt();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const assignFriendsToReceipt = async () => {
    if (selectedFriends.length === 0) return;

    try {
      await fetch(`http://localhost:5000/api/Receipt/assign-friends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptId: id,
          friendIds: selectedFriends
        }),
      });

      setSelectedFriends([]);
      fetchReceipt();
    } catch (error) {
      console.error('Error assigning friends:', error);
    }
  };

  if (!receipt) {
    return <div>Loading...</div>;
  }

  return (
    <div className="receipt-detail">
      <h2>{receipt.name || `Receipt #${receipt.id}`}</h2>
      <div className="receipt-summary">
        <p>Total: ${receipt.total.toFixed(2)}</p>
        <p>Tax: ${receipt.tax.toFixed(2)}</p>
        <p>Tips: ${receipt.tips.toFixed(2)}</p>
      </div>

      <div className="friends-section">
        <h3>Friends</h3>
        <div className="friends-list">
          {receipt.friends.map(friend => (
            <div key={friend.id} className="friend-item">
              {friend.name}
            </div>
          ))}
        </div>

        <div className="add-friends">
          <select
            multiple
            value={selectedFriends.map(String)}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => parseInt(option.value));
              setSelectedFriends(values);
            }}
          >
            {friends.map(friend => (
              <option key={friend.id} value={friend.id}>
                {friend.name}
              </option>
            ))}
          </select>
          <button onClick={assignFriendsToReceipt}>Add Selected Friends</button>
        </div>
      </div>

      <div className="items-section">
        <h3>Items</h3>
        <div className="items-list">
          {receipt.items.map(item => (
            <div key={item.id} className="item-card">
              <h4>{item.name}</h4>
              <p>Price: ${item.price.toFixed(2)}</p>
              <p>Quantity: {item.quantity}</p>
              <div className="assignments">
                {item.assignments.map(assignment => (
                  <div key={assignment.id} className="assignment">
                    <p>{assignment.unitlabel}</p>
                    <p>Shared by: {assignment.assignedFriends.map(f => f.name).join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="add-item">
          <input
            type="text"
            placeholder="Item name"
            value={newItem.name}
            onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Price"
            value={newItem.price}
            onChange={(e) => setNewItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
            step="0.01"
          />
          <input
            type="number"
            placeholder="Quantity"
            value={newItem.quantity}
            onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
            min="1"
          />
          <button onClick={addItem}>Add Item</button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDetail; 