import React from 'react';
import './App.css';
import ReceiptForm from './components/ReceiptForm';
import FriendForm from './components/FriendForm';
import ReceiptList from './components/ReceiptList';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Check Splitter</h1>
      </header>
      <main>
        <div className="forms-container">
          <ReceiptForm />
          <FriendForm />
        </div>
        <ReceiptList />
      </main>
    </div>
  );
}

export default App; 