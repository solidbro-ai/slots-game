import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Symbol from './Symbol';

// Generate random symbols for spinning animation
const generateSpinSymbols = (count = 20) => {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 20) + 1);
};

export default function Reel({ symbols, isSpinning, reelIndex, winningPositions }) {
  const [displaySymbols, setDisplaySymbols] = useState(symbols);
  const [spinning, setSpinning] = useState(false);
  const [spinOffset, setSpinOffset] = useState(0);
  const [hasLanded, setHasLanded] = useState(true); // Track if landing animation is done
  const spinSymbolsRef = useRef(generateSpinSymbols(30));
  const spinCountRef = useRef(0); // Stable key for each spin cycle
  
  const SYMBOL_HEIGHT = 110;
  const SPIN_DURATION = 0.15; // Duration per symbol
  const STOP_DELAY = reelIndex * 200; // Stagger stop times

  useEffect(() => {
    if (isSpinning && !spinning) {
      // Start spinning
      setSpinning(true);
      setHasLanded(false);
      spinCountRef.current += 1; // Increment for new key
      spinSymbolsRef.current = generateSpinSymbols(30);
      
      // Animate through symbols rapidly
      let offset = 0;
      const spinInterval = setInterval(() => {
        offset += SYMBOL_HEIGHT;
        setSpinOffset(offset);
      }, 50);

      // Stop after delay based on reel index
      setTimeout(() => {
        clearInterval(spinInterval);
        setSpinning(false);
        setDisplaySymbols(symbols);
        setSpinOffset(0);
        // Mark as landed after spring animation completes (~300ms)
        setTimeout(() => setHasLanded(true), 350);
      }, 800 + STOP_DELAY);

      return () => clearInterval(spinInterval);
    }
  }, [isSpinning, reelIndex, symbols]);

  // Update display when not spinning
  useEffect(() => {
    if (!isSpinning && !spinning) {
      setDisplaySymbols(symbols);
    }
  }, [symbols, isSpinning, spinning]);

  return (
    <div className="reel">
      <div className="reel-mask">
        {spinning ? (
          // Spinning animation - rapid symbol scroll
          <motion.div
            className="reel-strip spinning"
            animate={{ 
              y: [-spinOffset % (SYMBOL_HEIGHT * 10), -(spinOffset + SYMBOL_HEIGHT * 3) % (SYMBOL_HEIGHT * 10)]
            }}
            transition={{ 
              duration: SPIN_DURATION,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {spinSymbolsRef.current.map((symbolId, idx) => (
              <div key={idx} className="symbol">
                <img 
                  src={`/images/icon_${symbolId}.png`} 
                  alt={`Symbol ${symbolId}`}
                  draggable={false}
                />
              </div>
            ))}
          </motion.div>
        ) : (
          // Stopped - show actual results with bounce
          <motion.div 
            className="reel-strip"
            key={`stopped-${spinCountRef.current}`} // Stable key per spin cycle
            initial={hasLanded ? false : { y: -SYMBOL_HEIGHT * 2 }}
            animate={{ y: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 20,
              mass: 1,
            }}
          >
            {displaySymbols.map((symbolId, rowIndex) => {
              const isWinner = winningPositions.has(`${reelIndex}-${rowIndex}`);
              return (
                <Symbol
                  key={rowIndex}
                  symbolId={symbolId}
                  isWinner={isWinner}
                  row={rowIndex}
                />
              );
            })}
          </motion.div>
        )}
      </div>
      
      {/* Blur overlay during spin */}
      <AnimatePresence>
        {spinning && (
          <motion.div
            className="spin-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
