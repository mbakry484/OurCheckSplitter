import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import FriendsList from './components/FriendsList';
import ReceiptsList from './components/ReceiptsList';
import ReceiptDetail from './components/ReceiptDetail';
import CreateReceipt from './components/CreateReceipt';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <ul>
            <li><Link to="/">Receipts</Link></li>
            <li><Link to="/friends">Friends</Link></li>
            <li><Link to="/create-receipt">Create Receipt</Link></li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<ReceiptsList />} />
          <Route path="/friends" element={<FriendsList />} />
          <Route path="/receipts/:id" element={<ReceiptDetail />} />
          <Route path="/create-receipt" element={<CreateReceipt />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 