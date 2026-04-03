/**
 * Slots Game Configuration
 * Tuned for 98% RTP with Aristocrat-style balancing
 */

const reelMath = require('./reel-math');

module.exports = {
  // Target RTP (Return to Player) - 98%
  payoutRate: 0.98,

  // Feature toggles
  features: {
    freeSpins: {
      enabled: true,
      // Free spins awarded based on scatter count
      awards: {
        3: 15, // 3 scatters = 15 free spins
        4: 20, // 4 scatters = 20 free spins
        5: 25, // 5 scatters = 25 free spins
      },
      // Multiplier applied during free spins (boosts RTP)
      multiplier: 2,
      // Can retrigger during free spins
      canRetrigger: true,
    },
    holdAndSpin: {
      enabled: true,
      // Minimum symbols to trigger
      triggerCount: 6,
      // Initial spins awarded
      initialSpins: 3,
      // Spins reset to this when new symbol lands
      respinCount: 3,
      // Jackpots (multiplier of total bet) - reduced for 98% RTP balance
      jackpots: {
        mini: 2,     // 6-8 symbols (was 10)
        minor: 5,    // 9-11 symbols (was 25)
        major: 20,   // 12-14 symbols (was 100)
        grand: 100,  // 15 symbols - all filled (was 500)
      },
    },
  },

  // Reel configuration
  reels: {
    count: 5,
    rows: 3,
    stripLength: reelMath.STRIP_LENGTH,
  },

  // Icon configuration
  icons: {
    regular: {
      count: 20,
      // Payouts imported from math model
      payouts: reelMath.payouts,
    },
    wild: {
      id: 20,
      // Substitutes for symbols 1-19 (not features)
      substitutes: Array.from({ length: 19 }, (_, i) => i + 1),
    },
    freeSpins: {
      id: 21,
      maxPerReel: 1,
    },
    holdAndSpin: {
      id: 22,
      maxPerReel: null, // No limit
    },
  },

  // Symbol weights for reel generation
  symbolWeights: reelMath.symbolWeights,

  // Betting configuration
  betting: {
    minBetPerLine: 1,
    maxBetPerLine: 500,
    defaultBetPerLine: 1,
    availableBets: [1, 5, 25, 125, 500],
    availableLines: [1, 5, 15, 25, 50],
    defaultLines: 25,
  },

  // Starting credits for new users
  defaultCredits: 1000,

  // Win celebration thresholds (multiplier of bet)
  winThresholds: {
    nice: 5,      // "Nice Win"
    big: 15,      // "Big Win"
    mega: 30,     // "Mega Win"
    jackpot: 100, // "JACKPOT!"
  },

  // Animation placeholders (for future video support)
  animations: {
    enabled: false,
    paths: {
      freeSpinsTrigger: '/animations/free_spins_trigger.mp4',
      freeSpinsIntro: '/animations/free_spins_intro.mp4',
      holdAndSpinTrigger: '/animations/hold_spin_trigger.mp4',
      bigWin: '/animations/big_win.mp4',
      megaWin: '/animations/mega_win.mp4',
      jackpot: '/animations/jackpot.mp4',
    },
  },
};
