import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Symbol names for display
const SYMBOL_NAMES = {
  1: 'Cherry', 2: 'Lemon', 3: 'Orange', 4: 'Plum',
  5: 'Grape', 6: 'Melon', 7: 'Bell', 8: 'Bar',
  9: 'Double Bar', 10: 'Triple Bar', 11: 'Diamond', 12: 'Ruby',
  13: 'Emerald', 14: 'Sapphire', 15: 'Crown', 16: 'Star',
  17: 'Lucky 7', 18: 'Gold 7', 19: 'Platinum 7', 20: 'Wild',
  21: 'Free Spins', 22: 'Hold & Spin',
};

// Payouts for each symbol [3-of-kind, 4-of-kind, 5-of-kind]
const PAYOUTS = {
  1: [3, 10, 25], 2: [3, 10, 25], 3: [4, 12, 30], 4: [4, 12, 30],
  5: [6, 20, 50], 6: [6, 20, 50], 7: [8, 25, 75], 8: [8, 25, 75],
  9: [12, 40, 100], 10: [12, 40, 100], 11: [15, 50, 125], 12: [15, 50, 125],
  13: [25, 80, 200], 14: [25, 80, 200], 15: [35, 100, 300], 16: [35, 100, 300],
  17: [50, 150, 400], 18: [75, 200, 500], 19: [100, 300, 750], 20: [150, 500, 1000],
};

// Group symbols by rarity
const SYMBOL_GROUPS = [
  { name: 'Premium', symbols: [20, 19, 18, 17], color: '#ffd700' },
  { name: 'Rare', symbols: [16, 15, 14, 13], color: '#da70d6' },
  { name: 'Uncommon', symbols: [12, 11, 10, 9], color: '#00d4ff' },
  { name: 'Common', symbols: [8, 7, 6, 5], color: '#32cd32' },
  { name: 'Basic', symbols: [4, 3, 2, 1], color: '#aaaaaa' },
];

export default function Paytable({ betPerLine = 1 }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      <button 
        className="paytable-toggle"
        onClick={() => setIsOpen(true)}
      >
        📋 PAYTABLE
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="paytable-modal active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="paytable-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="paytable-close" onClick={() => setIsOpen(false)}>
                ×
              </button>

              <h2>PAYTABLE</h2>
              <p className="paytable-note">Payouts shown for {betPerLine} credit{betPerLine > 1 ? 's' : ''} per line</p>

              {/* Regular Symbols */}
              {SYMBOL_GROUPS.map((group) => (
                <div key={group.name} className="paytable-section">
                  <h3 style={{ color: group.color }}>{group.name} Symbols</h3>
                  <div className="paytable-grid">
                    {group.symbols.map((symbolId) => (
                      <div key={symbolId} className="payout-item">
                        <img 
                          src={`/images/icon_${symbolId}.png`} 
                          alt={SYMBOL_NAMES[symbolId]}
                        />
                        <div className="payout-name">{SYMBOL_NAMES[symbolId]}</div>
                        <div className="payout-values">
                          <span>×3: {PAYOUTS[symbolId][0] * betPerLine}</span>
                          <span>×4: {PAYOUTS[symbolId][1] * betPerLine}</span>
                          <span>×5: {PAYOUTS[symbolId][2] * betPerLine}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Special Symbols */}
              <div className="paytable-section">
                <h3 style={{ color: '#ff1493' }}>Special Symbols</h3>
                <div className="special-symbols">
                  <div className="special-symbol">
                    <img src="/images/icon_20.png" alt="Wild" />
                    <div className="special-info">
                      <h4>🃏 WILD</h4>
                      <p>Substitutes for all regular symbols (1-19)</p>
                      <p>Also pays as highest symbol!</p>
                    </div>
                  </div>
                  <div className="special-symbol">
                    <img src="/images/icon_21.png" alt="Free Spins" />
                    <div className="special-info">
                      <h4>✨ FREE SPINS SCATTER</h4>
                      <p>Land 3+ anywhere to trigger Free Spins!</p>
                      <ul>
                        <li>3 Scatters = 15 Free Spins</li>
                        <li>4 Scatters = 20 Free Spins</li>
                        <li>5 Scatters = 25 Free Spins</li>
                      </ul>
                      <p>All wins ×2 during Free Spins!</p>
                    </div>
                  </div>
                  <div className="special-symbol">
                    <img src="/images/icon_22.png" alt="Hold & Spin" />
                    <div className="special-info">
                      <h4>🔥 HOLD & SPIN</h4>
                      <p>Land 6+ to trigger Hold & Spin bonus!</p>
                      <ul>
                        <li>Each symbol shows a multiplier (1x-50x)</li>
                        <li>Fill all 15 positions for GRAND JACKPOT!</li>
                        <li>3 respins, resets when new symbol lands</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Jackpots */}
              <div className="paytable-section">
                <h3 style={{ color: '#ffd700' }}>Progressive Jackpots</h3>
                <div className="jackpot-info-grid">
                  <div className="jackpot-info-item grand">
                    <span className="jackpot-name">GRAND</span>
                    <span className="jackpot-desc">Fill all 15 positions</span>
                  </div>
                  <div className="jackpot-info-item major">
                    <span className="jackpot-name">MAJOR</span>
                    <span className="jackpot-desc">12-14 symbols</span>
                  </div>
                  <div className="jackpot-info-item minor">
                    <span className="jackpot-name">MINOR</span>
                    <span className="jackpot-desc">9-11 symbols</span>
                  </div>
                  <div className="jackpot-info-item mini">
                    <span className="jackpot-name">MINI</span>
                    <span className="jackpot-desc">6-8 symbols</span>
                  </div>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
