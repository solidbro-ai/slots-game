import React from 'react';
import { motion } from 'framer-motion';

export default function Symbol({ symbolId, isWinner, row }) {
  return (
    <motion.div
      className={`symbol ${isWinner ? 'winner' : ''}`}
      data-row={row}
      animate={isWinner ? {
        scale: [1, 1.1, 1],
        boxShadow: [
          'inset 0 0 20px rgba(255, 215, 0, 0.3)',
          'inset 0 0 40px rgba(255, 215, 0, 0.8)',
          'inset 0 0 20px rgba(255, 215, 0, 0.3)',
        ],
      } : {}}
      transition={isWinner ? {
        duration: 0.5,
        repeat: Infinity,
        ease: "easeInOut",
      } : {}}
    >
      <motion.img
        src={`/images/icon_${symbolId}.png`}
        alt={`Symbol ${symbolId}`}
        draggable={false}
        animate={isWinner ? {
          filter: [
            'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))',
            'drop-shadow(0 0 25px rgba(255, 215, 0, 1))',
            'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))',
          ],
        } : {}}
        transition={isWinner ? {
          duration: 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        } : {}}
      />
    </motion.div>
  );
}
