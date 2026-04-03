import React from 'react';
import Reel from './Reel';

export default function SlotMachine({ reels, isSpinning, wins }) {
  // Build set of winning positions for highlighting
  const winningPositions = new Set();
  wins?.forEach(win => {
    win.positions?.slice(0, win.matchCount).forEach(pos => {
      winningPositions.add(`${pos.reel}-${pos.row}`);
    });
  });

  return (
    <div className="slot-machine">
      <div className="machine-frame">
        <div className="machine-top">
          <div className="jackpot-lights">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="light" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>

        <div className="reels-container">
          <div className="reels-wrapper">
            {reels.map((symbols, reelIndex) => (
              <Reel
                key={reelIndex}
                symbols={symbols}
                isSpinning={isSpinning}
                reelIndex={reelIndex}
                winningPositions={winningPositions}
              />
            ))}
          </div>
        </div>

        <div className="machine-bottom">
          <div className="jackpot-lights">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="light" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
