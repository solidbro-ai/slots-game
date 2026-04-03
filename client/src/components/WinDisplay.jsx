import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WinDisplay({ amount, isActive }) {
  const [displayAmount, setDisplayAmount] = useState(0);

  // Animate counting up
  useEffect(() => {
    if (amount === 0) {
      setDisplayAmount(0);
      return;
    }

    const duration = 1000;
    const steps = 30;
    const increment = amount / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= amount) {
        setDisplayAmount(amount);
        clearInterval(timer);
      } else {
        setDisplayAmount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [amount]);

  return (
    <motion.div 
      className={`win-display ${isActive ? 'active' : ''}`}
      animate={isActive ? {
        scale: [1, 1.05, 1],
        boxShadow: [
          '0 0 30px rgba(220, 20, 60, 0.3)',
          '0 0 50px rgba(220, 20, 60, 0.6)',
          '0 0 30px rgba(220, 20, 60, 0.3)',
        ],
      } : {}}
      transition={{ duration: 0.5, repeat: isActive ? 3 : 0 }}
    >
      <div className="win-label">WIN</div>
      <motion.div 
        className="win-value"
        key={displayAmount}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
      >
        {displayAmount.toLocaleString()}
      </motion.div>
    </motion.div>
  );
}
