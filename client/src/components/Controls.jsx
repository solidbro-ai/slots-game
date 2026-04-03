import React from 'react';
import { motion } from 'framer-motion';

const BET_OPTIONS = [1, 2, 3, 5, 10];
const LINE_OPTIONS = [1, 5, 15, 25, 50]; // Must match server config

export default function Controls({ 
  betPerLine, 
  setBetPerLine, 
  lines, 
  setLines, 
  onSpin, 
  isSpinning,
  disabled,
  config,
  isFreeSpins = false,
}) {
  const totalBet = betPerLine * lines;

  return (
    <div className={`controls ${isFreeSpins ? 'free-spins-mode' : ''}`}>
      <div className="control-group">
        <label>BET PER LINE</label>
        <div className="bet-buttons">
          {BET_OPTIONS.map((bet) => (
            <button
              key={bet}
              className={`bet-btn ${betPerLine === bet ? 'active' : ''}`}
              onClick={() => setBetPerLine(bet)}
            >
              {bet}
            </button>
          ))}
        </div>
      </div>

      <div className="control-group">
        <label>LINES</label>
        <div className="bet-buttons">
          {LINE_OPTIONS.map((lineCount) => (
            <button
              key={lineCount}
              className={`bet-btn ${lines === lineCount ? 'active' : ''}`}
              onClick={() => setLines(lineCount)}
            >
              {lineCount}
            </button>
          ))}
        </div>
      </div>

      <div className="control-group total-bet">
        <label>TOTAL BET</label>
        <span className="ctrl-value large">{totalBet}</span>
      </div>

      <motion.button
        className="spin-btn"
        onClick={onSpin}
        disabled={isSpinning || disabled}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="spin-text">
          {isSpinning ? 'SPINNING...' : isFreeSpins ? 'FREE SPIN' : 'SPIN'}
        </span>
        <span className="spin-icon">🎰</span>
      </motion.button>

      <button 
        className="max-bet-btn" 
        onClick={() => {
          setBetPerLine(BET_OPTIONS[BET_OPTIONS.length - 1]);
          setLines(LINE_OPTIONS[LINE_OPTIONS.length - 1]);
        }}
      >
        MAX BET
      </button>
    </div>
  );
}
