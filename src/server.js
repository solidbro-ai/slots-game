/**
 * Slots Game Server
 * Express API for the slots game
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const db = require('./database');
const game = require('./game');
const jackpots = require('./jackpots');
const config = require('../config/game.config');

const app = express();

// Rate limiting: track last spin time per user (in-memory)
const lastSpinTime = new Map();
const SPIN_COOLDOWN_MS = 500; // 0.5 second cooldown between spins
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET || 'slots-game-secret-change-me',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Ensure user exists middleware
async function ensureUser(req, res, next) {
  try {
    if (!req.session.userId) {
      // Create anonymous user
      const userId = uuidv4();
      await db.users.create(userId);
      req.session.userId = userId;
    }

    // Fetch current user data
    req.user = await db.users.getById(req.session.userId);
    if (!req.user) {
      // Session has user ID but user doesn't exist, recreate
      const userId = uuidv4();
      await db.users.create(userId);
      req.session.userId = userId;
      req.user = await db.users.getById(userId);
    }

    next();
  } catch (error) {
    console.error('Error ensuring user:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

// ===================
// API Routes
// ===================

/**
 * Get game configuration (public settings)
 */
app.get('/api/config', (req, res) => {
  res.json({
    reels: config.reels,
    betting: config.betting,
    paylines: game.getPaylines(),
    icons: {
      regular: { count: config.icons.regular.count },
      freeSpins: { id: config.icons.freeSpins.id },
      holdAndSpin: { id: config.icons.holdAndSpin.id },
    },
    features: {
      freeSpins: { enabled: config.features.freeSpins.enabled },
      holdAndSpin: { enabled: config.features.holdAndSpin.enabled },
    },
    payouts: config.icons.regular.payouts,
  });
});

/**
 * Get all progressive jackpots
 */
app.get('/api/jackpots', async (req, res) => {
  try {
    const allJackpots = await jackpots.getAllJackpots();
    res.json(allJackpots);
  } catch (error) {
    console.error('Failed to get jackpots:', error);
    res.status(500).json({ error: 'Failed to get jackpots' });
  }
});

/**
 * Get user info and credits
 */
app.get('/api/user', ensureUser, async (req, res) => {
  res.json({
    id: req.user.id,
    credits: Number(req.user.credits),
    totalSpins: req.user.total_spins,
    biggestWin: Number(req.user.biggest_win),
  });
});

/**
 * Add credits (for testing/demo)
 */
app.post('/api/user/credits', ensureUser, async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount < 0 || amount > 10000) {
    return res.status(400).json({ error: 'Invalid amount (max 10000)' });
  }

  await db.users.addCredits(req.session.userId, amount);
  const user = await db.users.getById(req.session.userId);

  res.json({
    credits: Number(user.credits),
    added: amount,
  });
});

/**
 * Rate limit check - returns true if user should be blocked
 */
function checkRateLimit(userId) {
  const now = Date.now();
  const lastSpin = lastSpinTime.get(userId);
  
  if (lastSpin && (now - lastSpin) < SPIN_COOLDOWN_MS) {
    return { blocked: true, waitMs: SPIN_COOLDOWN_MS - (now - lastSpin) };
  }
  
  lastSpinTime.set(userId, now);
  return { blocked: false };
}

/**
 * Main spin endpoint
 */
app.post('/api/spin', ensureUser, async (req, res) => {
  try {
    // Rate limit check
    const rateCheck = checkRateLimit(req.session.userId);
    if (rateCheck.blocked) {
      return res.status(429).json({ 
        error: 'Too fast! Please wait before spinning again.',
        waitMs: rateCheck.waitMs 
      });
    }

    const { betPerLine, lines } = req.body;

    // Validate bet
    if (!betPerLine || betPerLine < config.betting.minBetPerLine || betPerLine > config.betting.maxBetPerLine) {
      return res.status(400).json({ error: 'Invalid bet per line' });
    }

    if (!lines || !config.betting.availableLines.includes(lines)) {
      return res.status(400).json({ error: 'Invalid number of lines' });
    }

    const totalBet = betPerLine * lines;

    // Check credits
    if (req.user.credits < totalBet) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Deduct bet
    const deducted = await db.users.deductCredits(req.session.userId, totalBet);
    if (!deducted) {
      return res.status(400).json({ error: 'Failed to deduct credits' });
    }

    // Play the round
    const result = game.playRound(betPerLine, lines);

    // Add winnings
    if (result.totalWin > 0) {
      await db.users.addCredits(req.session.userId, result.totalWin);
    }

    // Update stats
    await db.users.updateStats(req.session.userId, totalBet, result.totalWin);

    // Record spin
    await db.spins.record({
      userId: req.session.userId,
      spinType: 'normal',
      betPerLine,
      linesPlayed: lines,
      totalBet,
      totalWin: result.totalWin,
      reelResult: result.reelResult,
      winningLines: result.wins,
      featureTriggered: result.freeSpinsTrigger?.triggered
        ? 'free_spins'
        : result.holdAndSpinTrigger?.triggered
        ? 'hold_and_spin'
        : null,
    });

    // Fund jackpots from losses (25%) and wins (10%)
    const netLoss = totalBet - result.totalWin;
    if (netLoss > 0) {
      await jackpots.fundJackpots(betPerLine, netLoss, 0.25);
    } else if (result.totalWin > 0) {
      await jackpots.fundJackpots(betPerLine, result.totalWin, 0.10);
    }

    // Handle feature triggers
    let featureSession = null;
    if (result.freeSpinsTrigger?.triggered) {
      const featureId = uuidv4();
      await db.features.create({
        id: featureId,
        userId: req.session.userId,
        featureType: 'free_spins',
        initialSpins: result.freeSpinsTrigger.spins,
        spinsRemaining: result.freeSpinsTrigger.spins,
        multiplier: result.freeSpinsTrigger.multiplier,
        // Store bet values server-side to prevent manipulation
        state: {
          betPerLine,
          lines,
          totalBet,
        },
      });
      featureSession = {
        id: featureId,
        type: 'free_spins',
        spins: result.freeSpinsTrigger.spins,
        multiplier: result.freeSpinsTrigger.multiplier,
        positions: result.freeSpinsTrigger.positions,
      };
    } else if (result.holdAndSpinTrigger?.triggered) {
      const featureId = uuidv4();
      
      // Generate symbol data for initial H&S positions
      const heldSymbols = result.holdAndSpinTrigger.positions.map(pos => ({
        ...pos,
        ...jackpots.generateHoldSpinSymbol(),
      }));
      
      await db.features.create({
        id: featureId,
        userId: req.session.userId,
        featureType: 'hold_and_spin',
        initialSpins: result.holdAndSpinTrigger.spins,
        spinsRemaining: result.holdAndSpinTrigger.spins,
        state: { 
          heldPositions: heldSymbols,
          betPerLine,
          totalBet,
        },
      });
      featureSession = {
        id: featureId,
        type: 'hold_and_spin',
        spins: result.holdAndSpinTrigger.spins,
        heldPositions: heldSymbols,
        betPerLine,
      };
    }

    // Get updated credits and jackpots
    const updatedUser = await db.users.getById(req.session.userId);
    const updatedJackpots = await jackpots.getAllJackpots();

    res.json({
      reels: result.reelResult,
      wins: result.wins,
      totalWin: result.totalWin,
      totalBet,
      credits: Number(updatedUser.credits),
      feature: featureSession,
      animations: result.animations,
      jackpots: updatedJackpots,
    });
  } catch (error) {
    console.error('Spin error:', error);
    res.status(500).json({ error: 'Spin failed' });
  }
});

/**
 * Free spin endpoint
 */
app.post('/api/spin/free', ensureUser, async (req, res) => {
  try {
    // Rate limit check
    const rateCheck = checkRateLimit(req.session.userId);
    if (rateCheck.blocked) {
      return res.status(429).json({ 
        error: 'Too fast! Please wait before spinning again.',
        waitMs: rateCheck.waitMs 
      });
    }

    const { featureId } = req.body;
    // NOTE: We intentionally ignore client-sent betPerLine/lines to prevent manipulation

    // Verify active free spins session
    const feature = await db.features.getActive(req.session.userId);
    if (!feature || feature.id !== featureId || feature.feature_type !== 'free_spins') {
      return res.status(400).json({ error: 'No active free spins session' });
    }

    if (feature.spins_remaining <= 0) {
      return res.status(400).json({ error: 'No spins remaining' });
    }

    // Use stored bet values from feature session (prevents bet manipulation exploit)
    const state = typeof feature.state === 'string' ? JSON.parse(feature.state) : feature.state || {};
    const betPerLine = state.betPerLine || 1;
    const lines = state.lines || 25;

    // Play free spin round
    const result = game.playRound(betPerLine, lines, { isFreeSpin: true });

    // Update feature session
    const newSpinsRemaining = feature.spins_remaining - 1;
    let totalFeatureWin = Number(feature.total_win) + result.totalWin;

    // Check for retrigger
    let retriggered = false;
    let bonusSpins = 0;
    if (result.freeSpinsTrigger?.triggered && config.features.freeSpins.canRetrigger) {
      retriggered = true;
      bonusSpins = result.freeSpinsTrigger.spins;
    }

    await db.features.update(featureId, {
      spinsRemaining: newSpinsRemaining + bonusSpins,
      totalWin: totalFeatureWin,
      completed: newSpinsRemaining + bonusSpins <= 0,
    });

    // Add winnings
    if (result.totalWin > 0) {
      await db.users.addCredits(req.session.userId, result.totalWin);
    }

    // Record spin
    await db.spins.record({
      userId: req.session.userId,
      spinType: 'free_spin',
      betPerLine,
      linesPlayed: lines,
      totalBet: 0,
      totalWin: result.totalWin,
      reelResult: result.reelResult,
      winningLines: result.wins,
    });

    const updatedUser = await db.users.getById(req.session.userId);

    res.json({
      reels: result.reelResult,
      wins: result.wins,
      totalWin: result.totalWin,
      credits: Number(updatedUser.credits),
      spinsRemaining: newSpinsRemaining + bonusSpins,
      featureComplete: newSpinsRemaining + bonusSpins <= 0,
      featureTotalWin: totalFeatureWin,
      retriggered,
      bonusSpins,
      animations: result.animations,
    });
  } catch (error) {
    console.error('Free spin error:', error);
    res.status(500).json({ error: 'Free spin failed' });
  }
});

/**
 * Hold and spin endpoint - with multipliers and jackpots
 */
app.post('/api/spin/holdandspin', ensureUser, async (req, res) => {
  try {
    // Rate limit check
    const rateCheck = checkRateLimit(req.session.userId);
    if (rateCheck.blocked) {
      return res.status(429).json({ 
        error: 'Too fast! Please wait before spinning again.',
        waitMs: rateCheck.waitMs 
      });
    }

    const { featureId } = req.body;

    // Verify active hold and spin session
    const feature = await db.features.getActive(req.session.userId);
    if (!feature || feature.id !== featureId || feature.feature_type !== 'hold_and_spin') {
      return res.status(400).json({ error: 'No active hold and spin session' });
    }

    const state = typeof feature.state === 'string' ? JSON.parse(feature.state) : feature.state || {};
    const betPerLine = state.betPerLine || 1;
    const totalBet = state.totalBet || betPerLine;
    const heldPositions = state.heldPositions || [];

    // Spin with held positions
    const reelResult = game.spin({
      isHoldAndSpin: true,
      heldPositions: heldPositions,
    });

    // Find new H&S symbols
    const holdSpinId = config.icons.holdAndSpin.id;
    const newHeldPositions = [...heldPositions];
    let newSymbolsLanded = 0;

    for (let reel = 0; reel < reelResult.length; reel++) {
      for (let row = 0; row < reelResult[reel].length; row++) {
        // Skip already held positions
        if (heldPositions.some(p => p.reel === reel && p.row === row)) {
          continue;
        }

        if (reelResult[reel][row] === holdSpinId) {
          // Generate multiplier and potential jackpot for new symbol
          const symbolData = jackpots.generateHoldSpinSymbol();
          newHeldPositions.push({
            reel,
            row,
            symbol: holdSpinId,
            multiplier: symbolData.multiplier,
            jackpot: symbolData.jackpot,
          });
          newSymbolsLanded++;
        }
      }
    }

    // Calculate spins remaining
    let spinsRemaining = feature.spins_remaining - 1;
    if (newSymbolsLanded > 0) {
      spinsRemaining = config.features.holdAndSpin.respinCount;
    }

    const isComplete = spinsRemaining <= 0 || newHeldPositions.length >= 15;
    
    // Calculate payout if complete
    let payout = 0;
    let jackpotWins = [];
    
    if (isComplete) {
      // Sum up all multipliers × bet
      const multiplierTotal = newHeldPositions.reduce((sum, pos) => sum + (pos.multiplier || 1), 0);
      payout = multiplierTotal * totalBet;
      
      // Check for jackpot wins
      for (const pos of newHeldPositions) {
        if (pos.jackpot) {
          const jackpotAmount = await jackpots.winJackpot(req.session.userId, betPerLine, pos.jackpot);
          payout += jackpotAmount;
          jackpotWins.push({ type: pos.jackpot, amount: jackpotAmount });
        }
      }

      await db.users.addCredits(req.session.userId, payout);
    }

    // Update feature session
    await db.features.update(featureId, {
      spinsRemaining,
      totalWin: payout,
      state: { 
        heldPositions: newHeldPositions,
        betPerLine,
        totalBet,
      },
      completed: isComplete,
    });

    const updatedUser = await db.users.getById(req.session.userId);

    res.json({
      reels: reelResult,
      heldPositions: newHeldPositions,
      spinsRemaining,
      newSymbolsLanded,
      totalSymbols: newHeldPositions.length,
      featureComplete: isComplete,
      featureTotalWin: payout,
      jackpotWins,
      isGrandJackpot: newHeldPositions.length >= 15,
      credits: Number(updatedUser.credits),
    });
  } catch (error) {
    console.error('Hold and spin error:', error);
    res.status(500).json({ error: 'Hold and spin failed' });
  }
});

/**
 * Get spin history
 */
app.get('/api/history', ensureUser, async (req, res) => {
  const history = await db.spins.getHistory(req.session.userId, 50);
  res.json(history);
});

/**
 * Get leaderboard
 */
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await db.users.getLeaderboard(10);
    res.json(leaderboard);
  } catch (error) {
    res.json([]);
  }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend (catch-all for SPA)
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
async function start() {
  try {
    await db.init();
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║     🎰 SLOTS GAME SERVER RUNNING 🎰       ║
╠═══════════════════════════════════════════╣
║  Port: ${PORT}                               ║
║  URL:  http://localhost:${PORT}              ║
╚═══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
