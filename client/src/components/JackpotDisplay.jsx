import React from 'react';
import { motion } from 'framer-motion';

const JACKPOT_TIERS = [
  { key: 'grand', image: '/images/jackpot-grand.png', color: '#ffd700', glowColor: 'rgba(255, 215, 0, 0.6)' },
  { key: 'major', image: '/images/jackpot-major.png', color: '#ff4444', glowColor: 'rgba(255, 68, 68, 0.6)' },
  { key: 'minor', image: '/images/jackpot-minor.png', color: '#44ff44', glowColor: 'rgba(68, 255, 68, 0.6)' },
  { key: 'mini', image: '/images/jackpot-mini.png', color: '#44aaff', glowColor: 'rgba(68, 170, 255, 0.6)' },
];

export default function JackpotDisplay({ jackpots, betLevel = 1 }) {
  // Get jackpots for current bet level, fallback to empty object
  const currentJackpots = jackpots?.[betLevel] || {};

  return (
    <div className="jackpot-display">
      {JACKPOT_TIERS.map((tier, index) => (
        <motion.div
          key={tier.key}
          className={`jackpot-tier jackpot-${tier.key}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <img 
            src={tier.image} 
            alt={tier.key} 
            className="jackpot-image"
          />
          <motion.div
            className="jackpot-value"
            style={{ 
              color: tier.color,
              textShadow: `0 0 20px ${tier.glowColor}`
            }}
            key={currentJackpots[tier.key]}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            {(currentJackpots[tier.key] || 0).toLocaleString()}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
