/**
 * Slots Game Logic
 * Aristocrat-style weighted reel system with ~98% RTP
 */

const config = require('../config/game.config');
const reelMath = require('../config/reel-math');
const paylines = require('../config/paylines');
const { v4: uuidv4 } = require('uuid');

// Pre-generate weighted reel strips
let reelStrips = reelMath.generateAllReelStrips();

/**
 * Spin the reels using weighted probability
 * All symbols can only appear once per reel EXCEPT icon 22 (hold & spin)
 */
function spin(options = {}) {
  const { isFreeSpin = false, isHoldAndSpin = false, heldPositions = [] } = options;
  const result = [];
  const holdSpinId = config.icons.holdAndSpin.id;
  const freeSpinId = config.icons.freeSpins.id;

  for (let reel = 0; reel < config.reels.count; reel++) {
    const reelResult = [];
    const usedSymbols = new Set();
    
    // Track held symbols
    heldPositions
      .filter(p => p.reel === reel)
      .forEach(p => {
        if (p.symbol !== holdSpinId) {
          usedSymbols.add(p.symbol);
        }
      });

    for (let row = 0; row < config.reels.rows; row++) {
      // Check if this position is held
      const heldPos = heldPositions.find(p => p.reel === reel && p.row === row);
      
      if (heldPos) {
        reelResult.push(heldPos.symbol);
        continue;
      }

      // Pick a weighted random symbol
      let symbol = pickWeightedSymbol(usedSymbols, holdSpinId, freeSpinId, reel, reelResult);
      
      // Mark as used (except hold & spin which can repeat)
      if (symbol !== holdSpinId) {
        usedSymbols.add(symbol);
      }

      reelResult.push(symbol);
    }
    
    result.push(reelResult);
  }

  return result;
}

/**
 * Pick a symbol using weighted probability, avoiding duplicates
 */
function pickWeightedSymbol(usedSymbols, holdSpinId, freeSpinId, reelIndex, currentReel) {
  const weights = config.symbolWeights;
  
  // Build available symbols with weights
  const available = [];
  let totalWeight = 0;

  for (const [symbolStr, weight] of Object.entries(weights)) {
    const symbol = parseInt(symbolStr);
    
    // Skip if already used (unless it's hold & spin)
    if (symbol !== holdSpinId && usedSymbols.has(symbol)) {
      continue;
    }
    
    // Free spin scatter: max 1 per reel
    if (symbol === freeSpinId && currentReel.includes(freeSpinId)) {
      continue;
    }

    available.push({ symbol, weight });
    totalWeight += weight;
  }

  // Weighted random selection
  let random = Math.random() * totalWeight;
  
  for (const item of available) {
    random -= item.weight;
    if (random <= 0) {
      return item.symbol;
    }
  }

  // Fallback
  return available[0]?.symbol || 1;
}

/**
 * Check wins on all active paylines
 */
function checkWins(reelResult, linesPlayed, betPerLine) {
  const wins = [];
  const activePaylines = paylines.slice(0, linesPlayed);

  for (const line of activePaylines) {
    const symbols = line.pattern.map((row, reel) => reelResult[reel][row]);
    const lineWin = evaluateLine(symbols, betPerLine);

    if (lineWin.payout > 0) {
      wins.push({
        lineNumber: line.lineNumber,
        pattern: line.pattern,
        symbols,
        matchedSymbol: lineWin.symbol,
        matchCount: lineWin.count,
        payout: lineWin.payout,
        positions: line.pattern.map((row, reel) => ({ reel, row })),
      });
    }
  }

  // Deduplicate overlapping wins (same positions, keep highest)
  return deduplicateWins(wins);
}

/**
 * Remove duplicate wins on same positions, keeping highest payout
 */
function deduplicateWins(wins) {
  const positionMap = new Map();
  
  for (const win of wins) {
    const key = win.positions.map(p => `${p.reel},${p.row}`).slice(0, win.matchCount).join('|');
    const existing = positionMap.get(key);
    
    if (!existing || win.payout > existing.payout) {
      positionMap.set(key, win);
    }
  }
  
  return Array.from(positionMap.values());
}

/**
 * Wild symbol configuration
 * Icon 20 is WILD - substitutes for symbols 1-19 (not features 21/22)
 */
const WILD_SYMBOL = 20;

/**
 * Check if a symbol is wild
 */
function isWild(symbol) {
  return symbol === WILD_SYMBOL;
}

/**
 * Check if a symbol can be matched (regular symbols 1-19, or wild)
 */
function isMatchable(symbol) {
  return symbol >= 1 && symbol <= WILD_SYMBOL;
}

/**
 * Check if two symbols match (considering wilds)
 * Wild matches any symbol 1-19 (and other wilds)
 */
function symbolsMatch(a, b) {
  // Features never match
  if (!isMatchable(a) || !isMatchable(b)) return false;
  // Wilds match everything matchable
  if (isWild(a) || isWild(b)) return true;
  // Same symbol
  return a === b;
}

/**
 * Evaluate a single payline for wins (with wild support)
 */
function evaluateLine(symbols, betPerLine) {
  const firstSymbol = symbols[0];

  // Skip feature symbols for line pays (21, 22 don't form line wins)
  if (!isMatchable(firstSymbol)) {
    return { payout: 0 };
  }

  // Find the "base" symbol for this line (first non-wild, or wild if all wilds)
  let baseSymbol = firstSymbol;
  if (isWild(firstSymbol)) {
    // Look for first non-wild to determine what we're matching
    for (let i = 1; i < symbols.length; i++) {
      if (isMatchable(symbols[i]) && !isWild(symbols[i])) {
        baseSymbol = symbols[i];
        break;
      }
    }
    // If all wilds, use wild's own payout (which is high!)
  }

  // Count consecutive matching symbols from left (wilds count as matches)
  let matchCount = 1;
  for (let i = 1; i < symbols.length; i++) {
    const current = symbols[i];
    
    // Check if this symbol continues the match
    if (symbolsMatch(baseSymbol, current)) {
      matchCount++;
      // If we found a non-wild and base was wild, update base
      if (isWild(baseSymbol) && !isWild(current) && isMatchable(current)) {
        baseSymbol = current;
      }
    } else {
      break;
    }
  }

  // Need at least 3 matching symbols
  if (matchCount < 3) {
    return { payout: 0 };
  }

  // Get payout for the base symbol (or wild if all wilds)
  const payoutTable = config.icons.regular.payouts[baseSymbol];
  if (!payoutTable) {
    return { payout: 0 };
  }

  // Payout index: 3-of-a-kind = 0, 4-of-a-kind = 1, 5-of-a-kind = 2
  const payoutIndex = matchCount - 3;
  const baseMultiplier = payoutTable[payoutIndex] || 0;
  
  // Apply RTP boost factor to achieve target RTP
  const rtpBoost = reelMath.rtpMultiplier || 1;
  const multiplier = Math.round(baseMultiplier * rtpBoost);

  return {
    symbol: baseSymbol,
    count: matchCount,
    payout: multiplier * betPerLine,
    hasWild: symbols.slice(0, matchCount).some(isWild),
  };
}

/**
 * Check for free spins trigger (scatter symbols)
 */
function checkFreeSpinsTrigger(reelResult) {
  if (!config.features.freeSpins.enabled) {
    return null;
  }

  const scatterId = config.icons.freeSpins.id;
  const positions = [];

  for (let reel = 0; reel < reelResult.length; reel++) {
    for (let row = 0; row < reelResult[reel].length; row++) {
      if (reelResult[reel][row] === scatterId) {
        positions.push({ reel, row });
      }
    }
  }

  const count = positions.length;
  if (count >= 3) {
    const awards = config.features.freeSpins.awards;
    return {
      triggered: true,
      count,
      spins: awards[count] || awards[5],
      positions,
      multiplier: config.features.freeSpins.multiplier,
    };
  }

  return null;
}

/**
 * Check for hold and spin trigger
 */
function checkHoldAndSpinTrigger(reelResult) {
  if (!config.features.holdAndSpin.enabled) {
    return null;
  }

  const holdSpinId = config.icons.holdAndSpin.id;
  const positions = [];

  for (let reel = 0; reel < reelResult.length; reel++) {
    for (let row = 0; row < reelResult[reel].length; row++) {
      if (reelResult[reel][row] === holdSpinId) {
        positions.push({ reel, row, symbol: holdSpinId });
      }
    }
  }

  if (positions.length >= config.features.holdAndSpin.triggerCount) {
    return {
      triggered: true,
      count: positions.length,
      spins: config.features.holdAndSpin.initialSpins,
      positions,
    };
  }

  return null;
}

/**
 * Process a hold and spin round
 */
function processHoldAndSpin(currentState, newSymbols) {
  const holdSpinId = config.icons.holdAndSpin.id;
  const heldPositions = [...currentState.heldPositions];
  let newSymbolsLanded = 0;

  // Check for new hold and spin symbols
  for (let reel = 0; reel < newSymbols.length; reel++) {
    for (let row = 0; row < newSymbols[reel].length; row++) {
      if (heldPositions.some(p => p.reel === reel && p.row === row)) {
        continue;
      }

      if (newSymbols[reel][row] === holdSpinId) {
        heldPositions.push({ reel, row, symbol: holdSpinId });
        newSymbolsLanded++;
      }
    }
  }

  let spinsRemaining = currentState.spinsRemaining - 1;
  if (newSymbolsLanded > 0) {
    spinsRemaining = config.features.holdAndSpin.respinCount;
  }

  const isGrandJackpot = heldPositions.length >= 15;

  return {
    heldPositions,
    spinsRemaining,
    newSymbolsLanded,
    isComplete: spinsRemaining <= 0 || isGrandJackpot,
    isGrandJackpot,
    totalSymbols: heldPositions.length,
  };
}

/**
 * Calculate hold and spin payout
 */
function calculateHoldAndSpinPayout(heldCount, totalBet) {
  const { jackpots } = config.features.holdAndSpin;

  if (heldCount >= 15) {
    return { type: 'grand', multiplier: jackpots.grand, payout: totalBet * jackpots.grand };
  } else if (heldCount >= 12) {
    return { type: 'major', multiplier: jackpots.major, payout: totalBet * jackpots.major };
  } else if (heldCount >= 9) {
    return { type: 'minor', multiplier: jackpots.minor, payout: totalBet * jackpots.minor };
  } else {
    return { type: 'mini', multiplier: jackpots.mini, payout: totalBet * jackpots.mini };
  }
}

/**
 * Execute a full game round
 */
function playRound(betPerLine, linesPlayed, options = {}) {
  const totalBet = betPerLine * linesPlayed;

  // Spin the reels
  const reelResult = spin(options);

  // Check for wins on paylines
  const wins = checkWins(reelResult, linesPlayed, betPerLine);
  let totalWin = wins.reduce((sum, w) => sum + w.payout, 0);

  // Apply multiplier if in free spins
  if (options.isFreeSpin && config.features.freeSpins.multiplier > 1) {
    totalWin *= config.features.freeSpins.multiplier;
    wins.forEach(w => w.payout *= config.features.freeSpins.multiplier);
  }

  // Check for feature triggers
  const freeSpinsTrigger = checkFreeSpinsTrigger(reelResult);
  const holdAndSpinTrigger = checkHoldAndSpinTrigger(reelResult);

  // Determine win level for animations
  const winLevel = getWinLevel(totalWin, totalBet);

  return {
    reelResult,
    wins,
    totalWin,
    totalBet,
    freeSpinsTrigger,
    holdAndSpinTrigger,
    winLevel,
  };
}

/**
 * Get win celebration level
 */
function getWinLevel(totalWin, totalBet) {
  if (totalBet === 0) return null;
  
  const multiplier = totalWin / totalBet;
  const thresholds = config.winThresholds;

  if (multiplier >= thresholds.jackpot) return 'jackpot';
  if (multiplier >= thresholds.mega) return 'mega';
  if (multiplier >= thresholds.big) return 'big';
  if (multiplier >= thresholds.nice) return 'nice';
  if (totalWin > 0) return 'win';
  return null;
}

/**
 * Regenerate reel strips
 */
function regenerateReels() {
  reelStrips = reelMath.generateAllReelStrips();
}

/**
 * Get theoretical RTP
 */
function getTheoreticalRTP() {
  return reelMath.calculateRTP();
}

module.exports = {
  spin,
  checkWins,
  checkFreeSpinsTrigger,
  checkHoldAndSpinTrigger,
  processHoldAndSpin,
  calculateHoldAndSpinPayout,
  playRound,
  regenerateReels,
  getTheoreticalRTP,
  getConfig: () => config,
  getPaylines: () => paylines,
};
