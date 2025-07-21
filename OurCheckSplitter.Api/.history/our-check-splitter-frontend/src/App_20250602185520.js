import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
// import ReceiptDetailsPage from './pages/ReceiptDetailsPage'; // Placeholder for now

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* <Route path="/receipt/:id" element={<ReceiptDetailsPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
