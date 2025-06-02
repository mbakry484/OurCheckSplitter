import React from 'react';

const emojiPattern = `🍕 🍔 🍟 🍩 🌮 🥪  🍕 🍔 🍟 🍩 🌮 🥪  🍕 🍔 🍟 🍩 🌮 🥪\n🍟 🍩 🌮 🥪 🍕 🍔 🍟 🍩 🌮 🥪 🍕 🍔 🍟 🍩 🌮 🥪 🍕\n🍩 🌮 🥪 🍕 🍔 🍟 🍩 🌮 🥪 🍕 🍔 🍟 🍩 🌮 🥪 🍕 🍔\n🌮 🥪 🍕 🍔 🍟 🍩 🌮 🥪 🍕 🍔 🍟 🍩 🌮 🥪 🍕 🍔 🍟\n🥪 🍕 🍔 🍟 🍩 🌮 🥪 🍕 🍔 🍟 🍩 🌮 🥪 🍕 🍔 🍟 🍩`;

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
        opacity: 0.13,
        fontSize: '2.2rem',
        whiteSpace: 'pre',
        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, NotoColorEmoji, Android Emoji, EmojiSymbols',
        background: 'linear-gradient(135deg, #fff 0%, #f5f7fa 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
    }}>
        <span>{emojiPattern}</span>
    </div>
);

export default BackgroundCharacters; 