import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function Header({ credits, onAddCredits, onToggleMute }) {
  const [muted, setMuted] = useState(false);

  const handleToggleMute = () => {
    const newMuted = onToggleMute?.() ?? !muted;
    setMuted(newMuted);
  };

  return (
    <header className="casino-header">
      <div className="logo">
        <motion.span 
          className="logo-icon"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🎰
        </motion.span>
        <h1>LUCKY SEVENS</h1>
        <span className="logo-subtitle">CASINO</span>
      </div>
      
      <div className="header-controls">
        <button 
          className="mute-btn" 
          onClick={handleToggleMute}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        
        <div className="credits-display">
          <div className="credits-label">CREDITS</div>
          <motion.div 
            className="credits-value"
            key={credits}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            {credits.toLocaleString()}
          </motion.div>
          <button 
            className="add-credits-btn" 
            onClick={onAddCredits}
            title="Add Credits"
          >
            +
          </button>
        </div>
      </div>
    </header>
  );
}
