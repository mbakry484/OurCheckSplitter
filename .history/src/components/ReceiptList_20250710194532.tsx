import React, { useState, useEffect } from 'react';

interface Receipt {
  id: number;
  name: string;
  tax: number;
  tips: number;
  total: number;
}

const ReceiptList: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/receipt');
      if (response.ok) {
        const data = await response.json();
        setReceipts(data);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/receipt/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setReceipts(receipts.filter(receipt => receipt.id !== id));
        alert('Receipt deleted successfully!');
      } else {
        alert('Failed to delete receipt');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting receipt');
    }
  };

  return (
    <div className="receipt-list">
      <h2>Receipts</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Tax</th>
            <th>Tips</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {receipts.map(receipt => (
            <tr key={receipt.id}>
              <td>{receipt.name}</td>
              <td>${receipt.tax.toFixed(2)}</td>
              <td>${receipt.tips.toFixed(2)}</td>
              <td>${receipt.total.toFixed(2)}</td>
              <td>
                <button onClick={() => handleDelete(receipt.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReceiptList; 