import React from 'react';
import { motion } from 'framer-motion';

export default function FeatureOverlay({ feature, onStart }) {
  const isFreeSpins = feature.type === 'free_spins';
  const isHoldAndSpin = feature.type === 'hold_and_spin';

  return (
    <motion.div
      className="feature-overlay active"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="feature-content"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <motion.h2 
          className="feature-title"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {isFreeSpins ? 'FREE SPINS!' : 'HOLD & SPIN!'}
        </motion.h2>
        
        <div className="feature-info">
          <motion.span 
            className="feature-spins"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            {feature.spins}
          </motion.span>
          <span className="feature-label">
            {isFreeSpins ? 'SPINS' : 'RESPINS'}
          </span>
        </div>
        
        {isFreeSpins && feature.multiplier > 1 && (
          <motion.div 
            className="feature-multiplier"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {feature.multiplier}x MULTIPLIER
          </motion.div>
        )}
        
        {isHoldAndSpin && (
          <motion.div 
            className="feature-multiplier"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Lock symbols & respin!
          </motion.div>
        )}

        <motion.button
          className="feature-start-btn"
          onClick={onStart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          START
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
