/**
 * Progressive Jackpots Module
 * Handles jackpot funding, payouts, and Hold & Spin mechanics
 */

const db = require('./database');

// Jackpot configuration (scaled by 50 for max lines)
const JACKPOT_CONFIG = {
  mini: { initial: 250, max: 1000, fundShare: 1/25 },
  minor: { initial: 500, max: 2500, fundShare: 3/25 },
  major: { initial: 5000, max: 25000, fundShare: 8/25 },
  grand: { initial: 50000, max: 250000, fundShare: 13/25 },
};

// Multiplier probabilities for Hold & Spin icons
const MULTIPLIER_WEIGHTS = [
  { value: 1, weight: 42.3 },
  { value: 2, weight: 25 },
  { value: 3, weight: 15 },
  { value: 5, weight: 10 },
  { value: 10, weight: 5 },
  { value: 25, weight: 2.5 },
  { value: 50, weight: 0.1 },
];

// Jackpot appearance chances (very rare)
const JACKPOT_CHANCES = {
  mini: 0.02,    // 2% chance when H&S icon lands
  minor: 0.008,  // 0.8%
  major: 0.002,  // 0.2%
  grand: 0.0005, // 0.05%
};

/**
 * Get all jackpots for a specific bet level
 */
async function getJackpots(betLevel) {
  const pool = db.getPool();
  const [rows] = await pool.execute(
    'SELECT jackpot_type, current_value FROM progressive_jackpots WHERE bet_level = ?',
    [betLevel]
  );
  
  const jackpots = {};
  rows.forEach(row => {
    jackpots[row.jackpot_type] = Number(row.current_value);
  });
  
  return jackpots;
}

/**
 * Get all jackpots for all bet levels (for display)
 */
async function getAllJackpots() {
  const pool = db.getPool();
  const [rows] = await pool.execute(
    'SELECT bet_level, jackpot_type, current_value FROM progressive_jackpots ORDER BY bet_level, FIELD(jackpot_type, "mini", "minor", "major", "grand")'
  );
  
  const jackpots = {};
  rows.forEach(row => {
    if (!jackpots[row.bet_level]) {
      jackpots[row.bet_level] = {};
    }
    jackpots[row.bet_level][row.jackpot_type] = Number(row.current_value);
  });
  
  return jackpots;
}

/**
 * Fund jackpots from bets
 * @param betLevel - The bet per line level
 * @param amount - Amount to fund from
 * @param percentage - Percentage of amount to contribute (0.25 for losses, 0.10 for wins)
 */
async function fundJackpots(betLevel, amount, percentage = 0.25) {
  const pool = db.getPool();
  const fundingPool = amount * percentage;

  for (const [type, config] of Object.entries(JACKPOT_CONFIG)) {
    const contribution = fundingPool * config.fundShare;
    const maxValue = config.max * betLevel;

    await pool.execute(
      `UPDATE progressive_jackpots 
       SET current_value = LEAST(current_value + ?, ?) 
       WHERE bet_level = ? AND jackpot_type = ?`,
      [contribution, maxValue, betLevel, type]
    );
  }
}

/**
 * Win a jackpot - returns the amount and resets it
 */
async function winJackpot(userId, betLevel, jackpotType) {
  const pool = db.getPool();
  
  // Get current value
  const [rows] = await pool.execute(
    'SELECT current_value, initial_value FROM progressive_jackpots WHERE bet_level = ? AND jackpot_type = ?',
    [betLevel, jackpotType]
  );
  
  if (rows.length === 0) return 0;
  
  const amount = Number(rows[0].current_value);
  const initialValue = Number(rows[0].initial_value);
  
  // Reset jackpot and record win
  await pool.execute(
    `UPDATE progressive_jackpots 
     SET current_value = ?, last_won_at = NOW(), last_won_by = ?, last_won_amount = ?
     WHERE bet_level = ? AND jackpot_type = ?`,
    [initialValue, userId, amount, betLevel, jackpotType]
  );
  
  // Record in history
  await pool.execute(
    'INSERT INTO jackpot_history (user_id, bet_level, jackpot_type, amount) VALUES (?, ?, ?, ?)',
    [userId, betLevel, jackpotType, amount]
  );
  
  return amount;
}

/**
 * Generate a random multiplier for a Hold & Spin icon
 */
function generateMultiplier() {
  const totalWeight = MULTIPLIER_WEIGHTS.reduce((sum, m) => sum + m.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const mult of MULTIPLIER_WEIGHTS) {
    random -= mult.weight;
    if (random <= 0) {
      return mult.value;
    }
  }
  
  return 1;
}

/**
 * Check if a Hold & Spin icon should be a jackpot
 * Returns null or jackpot type
 */
function checkForJackpot() {
  const roll = Math.random();
  let cumulative = 0;
  
  // Check from rarest to most common
  for (const type of ['grand', 'major', 'minor', 'mini']) {
    cumulative += JACKPOT_CHANCES[type];
    if (roll < cumulative) {
      return type;
    }
  }
  
  return null;
}

/**
 * Generate Hold & Spin symbol data
 * Returns { multiplier, jackpot: null|'mini'|'minor'|'major'|'grand' }
 */
function generateHoldSpinSymbol() {
  return {
    multiplier: generateMultiplier(),
    jackpot: checkForJackpot(),
  };
}

module.exports = {
  JACKPOT_CONFIG,
  MULTIPLIER_WEIGHTS,
  getJackpots,
  getAllJackpots,
  fundJackpots,
  winJackpot,
  generateMultiplier,
  checkForJackpot,
  generateHoldSpinSymbol,
};
