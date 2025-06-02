import React from 'react';

const BackgroundCharacters = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  }}>
    {/* Example SVG characters - you can replace with your own or use Open Peeps/undraw illustrations */}
    <svg width="180" height="180" style={{ position: 'absolute', top: 40, left: 40, opacity: 0.18 }}>
      <circle cx="90" cy="90" r="80" fill="#ff9800" />
      <ellipse cx="90" cy="120" rx="50" ry="30" fill="#fff" opacity="0.7" />
      <circle cx="70" cy="80" r="10" fill="#333" />
      <circle cx="110" cy="80" r="10" fill="#333" />
      <rect x="80" y="110" width="20" height="8" rx="4" fill="#333" />
    </svg>
    <svg width="160" height="160" style={{ position: 'absolute', bottom: 60, right: 60, opacity: 0.15 }}>
      <rect x="20" y="20" width="120" height="120" rx="30" fill="#1976d2" />
      <ellipse cx="80" cy="110" rx="40" ry="20" fill="#fff" opacity="0.7" />
      <circle cx="60" cy="70" r="12" fill="#333" />
      <circle cx="100" cy="70" r="12" fill="#333" />
      <rect x="70" y="100" width="20" height="10" rx="5" fill="#333" />
    </svg>
    {/* Add more SVGs or use PNGs as needed for more variety */}
  </div>
);

export default BackgroundCharacters; 