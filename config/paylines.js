/**
 * Payline Definitions
 * 50 unique payline patterns across 5 reels x 3 rows
 * 
 * Each payline is an array of 5 numbers (one per reel)
 * representing the row position: 0 = top, 1 = middle, 2 = bottom
 * 
 * Reel positions:
 *   Reel:  1   2   3   4   5
 *   Row 0: [0] [0] [0] [0] [0]  <- Top
 *   Row 1: [1] [1] [1] [1] [1]  <- Middle
 *   Row 2: [2] [2] [2] [2] [2]  <- Bottom
 */

const paylines = [
  // Lines 1-5: Straight lines
  [1, 1, 1, 1, 1], // Line 1: Middle row (straight across)
  [0, 0, 0, 0, 0], // Line 2: Top row
  [2, 2, 2, 2, 2], // Line 3: Bottom row
  [0, 1, 2, 1, 0], // Line 4: Top-left to bottom-middle to top-right (V shape)
  [2, 1, 0, 1, 2], // Line 5: Bottom-left to top-middle to bottom-right (inverted V)

  // Lines 6-10: Zigzags
  [0, 0, 1, 2, 2], // Line 6: Descending diagonal
  [2, 2, 1, 0, 0], // Line 7: Ascending diagonal
  [1, 0, 0, 0, 1], // Line 8: Top bump
  [1, 2, 2, 2, 1], // Line 9: Bottom bump
  [0, 1, 1, 1, 0], // Line 10: Slight V

  // Lines 11-15: Wave patterns
  [2, 1, 1, 1, 2], // Line 11: Slight inverted V
  [0, 1, 0, 1, 0], // Line 12: Top zigzag
  [2, 1, 2, 1, 2], // Line 13: Bottom zigzag
  [1, 0, 1, 0, 1], // Line 14: Upper wave
  [1, 2, 1, 2, 1], // Line 15: Lower wave

  // Lines 16-20: Extended patterns
  [0, 0, 1, 0, 0], // Line 16: Top with middle dip
  [2, 2, 1, 2, 2], // Line 17: Bottom with middle rise
  [1, 1, 0, 1, 1], // Line 18: Middle with top bump
  [1, 1, 2, 1, 1], // Line 19: Middle with bottom bump
  [0, 2, 0, 2, 0], // Line 20: Extreme zigzag top

  // Lines 21-25: Complex patterns
  [2, 0, 2, 0, 2], // Line 21: Extreme zigzag bottom
  [0, 1, 2, 2, 2], // Line 22: Descending step
  [2, 1, 0, 0, 0], // Line 23: Ascending step
  [0, 0, 0, 1, 2], // Line 24: Late descent
  [2, 2, 2, 1, 0], // Line 25: Late ascent

  // Lines 26-30: Staircase patterns
  [0, 0, 1, 2, 1], // Line 26: Down then up
  [2, 2, 1, 0, 1], // Line 27: Up then down
  [1, 0, 0, 1, 2], // Line 28: Peak left
  [1, 2, 2, 1, 0], // Line 29: Valley left
  [0, 1, 2, 2, 1], // Line 30: Descending plateau

  // Lines 31-35: Asymmetric patterns
  [2, 1, 0, 0, 1], // Line 31: Ascending plateau
  [0, 2, 1, 2, 0], // Line 32: W shape variant
  [2, 0, 1, 0, 2], // Line 33: M shape variant
  [1, 0, 2, 0, 1], // Line 34: Deep V variant
  [1, 2, 0, 2, 1], // Line 35: Inverted deep V

  // Lines 36-40: Mixed patterns
  [0, 1, 1, 2, 2], // Line 36: Gentle descent
  [2, 1, 1, 0, 0], // Line 37: Gentle ascent
  [0, 0, 2, 2, 1], // Line 38: Drop then rise
  [2, 2, 0, 0, 1], // Line 39: Rise then drop
  [1, 0, 1, 2, 1], // Line 40: Peak then valley

  // Lines 41-45: Advanced patterns
  [1, 2, 1, 0, 1], // Line 41: Valley then peak
  [0, 2, 2, 2, 0], // Line 42: Deep U shape
  [2, 0, 0, 0, 2], // Line 43: Inverted U shape
  [0, 1, 2, 1, 2], // Line 44: Offset descent
  [2, 1, 0, 1, 0], // Line 45: Offset ascent

  // Lines 46-50: Final patterns
  [1, 0, 2, 1, 0], // Line 46: Rolling hills
  [1, 2, 0, 1, 2], // Line 47: Rolling valleys
  [0, 2, 1, 0, 2], // Line 48: Double cross
  [2, 0, 1, 2, 0], // Line 49: Inverted double cross
  [0, 1, 0, 2, 1], // Line 50: Complex wave
];

// Export with line numbers (1-indexed for display)
module.exports = paylines.map((pattern, index) => ({
  lineNumber: index + 1,
  pattern: pattern,
}));
