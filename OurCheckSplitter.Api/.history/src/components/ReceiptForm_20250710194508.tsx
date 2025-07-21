import React, { useState } from 'react';

interface Receipt {
  name: string;
  tax: number;
  tips: number;
  total: number;
}

const ReceiptForm: React.FC = () => {
  const [receipt, setReceipt] = useState<Receipt>({
    name: '',
    tax: 0,
    tips: 0,
    total: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receipt),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Receipt created:', data);
        alert('Receipt created successfully!');
      } else {
        alert('Failed to create receipt');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating receipt');
    }
  };

  return (
    <div className="form-container">
      <h2>Create Receipt</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={receipt.name}
            onChange={(e) => setReceipt({ ...receipt, name: e.target.value })}
          />
        </div>
        <div>
          <label>Tax:</label>
          <input
            type="number"
            value={receipt.tax}
            onChange={(e) => setReceipt({ ...receipt, tax: parseFloat(e.target.value) })}
          />
        </div>
        <div>
          <label>Tips:</label>
          <input
            type="number"
            value={receipt.tips}
            onChange={(e) => setReceipt({ ...receipt, tips: parseFloat(e.target.value) })}
          />
        </div>
        <div>
          <label>Total:</label>
          <input
            type="number"
            value={receipt.total}
            onChange={(e) => setReceipt({ ...receipt, total: parseFloat(e.target.value) })}
          />
        </div>
        <button type="submit">Create Receipt</button>
      </form>
    </div>
  );
};

export default ReceiptForm; 