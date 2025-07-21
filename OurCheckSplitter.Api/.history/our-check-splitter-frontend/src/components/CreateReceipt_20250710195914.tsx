import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateReceipt: React.FC = () => {
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState({
    name: '',
    tax: 0,
    tips: 0,
    total: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/Receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receipt),
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/receipts/${data.id}`);
      }
    } catch (error) {
      console.error('Error creating receipt:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setReceipt(prev => ({
      ...prev,
      [name]: name === 'name' ? value : parseFloat(value) || 0
    }));
  };

  return (
    <div className="create-receipt">
      <h2>Create New Receipt</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={receipt.name}
            onChange={handleChange}
            placeholder="Receipt name"
          />
        </div>
        <div>
          <label>Tax:</label>
          <input
            type="number"
            name="tax"
            value={receipt.tax}
            onChange={handleChange}
            step="0.01"
          />
        </div>
        <div>
          <label>Tips:</label>
          <input
            type="number"
            name="tips"
            value={receipt.tips}
            onChange={handleChange}
            step="0.01"
          />
        </div>
        <div>
          <label>Total:</label>
          <input
            type="number"
            name="total"
            value={receipt.total}
            onChange={handleChange}
            step="0.01"
          />
        </div>
        <button type="submit">Create Receipt</button>
      </form>
    </div>
  );
};

export default CreateReceipt; 