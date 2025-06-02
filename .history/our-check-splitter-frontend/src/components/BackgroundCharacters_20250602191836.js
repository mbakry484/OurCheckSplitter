import React from 'react';

// SVG pattern with food emojis
const emojiTile = encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>
    <text x='10' y='30' font-size='32'>🍕</text>
    <text x='40' y='30' font-size='32'>🍔</text>
    <text x='10' y='65' font-size='32'>🍟</text>
    <text x='40' y='65' font-size='32'>🍩</text>
    <text x='25' y='50' font-size='32'>🌮</text>
    <text x='55' y='50' font-size='32'>🥪</text>
  </svg>
`);

const BackgroundCharacters = () => (
    <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.13,
        backgroundImage: `url("data:image/svg+xml,${emojiTile}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '80px 80px',
        backgroundPosition: 'center',
    }} />
);

export default BackgroundCharacters; 