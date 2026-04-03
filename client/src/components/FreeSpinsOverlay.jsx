import React from 'react';
import { motion } from 'framer-motion';

export default function FreeSpinsOverlay({ spins }) {
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
          className="feature-title free-spins-won"
          animate={{ 
            scale: [1, 1.1, 1],
            textShadow: [
              '0 0 50px rgba(255, 215, 0, 0.5)',
              '0 0 100px rgba(255, 215, 0, 1)',
              '0 0 50px rgba(255, 215, 0, 0.5)',
            ]
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          FEATURE WON!
        </motion.h2>
        
        <div className="feature-info">
          <motion.span 
            className="feature-spins"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 150 }}
          >
            {spins}
          </motion.span>
          <motion.span 
            className="feature-label"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            FREE SPINS
          </motion.span>
        </div>

        <motion.div 
          className="feature-multiplier"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          3x MULTIPLIER
        </motion.div>

        <motion.div
          className="auto-start-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 1.5, duration: 1, repeat: Infinity }}
        >
          Starting automatically...
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
