import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Receipt {
  id: number;
  name: string;
  total: number;
  tax: number;
  tips: number;
}

const ReceiptsList: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/Receipt');
      const data = await response.json();
      setReceipts(data);
    } catch (error) {
      console.error('Error fetching receipts:', error);
    }
  };

  const deleteReceipt = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/Receipt?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchReceipts();
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
    }
  };

  return (
    <div className="receipts-list">
      <h2>Receipts</h2>
      <div className="receipts-grid">
        {receipts.map((receipt) => (
          <div key={receipt.id} className="receipt-card">
            <h3>{receipt.name || `Receipt #${receipt.id}`}</h3>
            <p>Total: ${receipt.total.toFixed(2)}</p>
            <p>Tax: ${receipt.tax.toFixed(2)}</p>
            <p>Tips: ${receipt.tips.toFixed(2)}</p>
            <div className="receipt-actions">
              <Link to={`/receipts/${receipt.id}`}>View Details</Link>
              <button onClick={() => deleteReceipt(receipt.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReceiptsList; 