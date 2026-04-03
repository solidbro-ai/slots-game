#!/usr/bin/env node
/**
 * Slot Machine Simulation Script
 * Creates 500 users, each plays 1000 spins with randomized bets
 * Logs all data for RTP analysis
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const db = require('../src/database');
const game = require('../src/game');
const jackpots = require('../src/jackpots');

// Configuration
const NUM_USERS = 1000;
const SPINS_PER_USER = 1000;
const STARTING_CREDITS = 100000;

// Available bet options (from game config)
const AVAILABLE_BETS = [1, 5, 25, 125, 500];
const AVAILABLE_LINES = [1, 5, 15, 25, 50];

// Results storage
const results = {
  startTime: new Date().toISOString(),
  config: {
    numUsers: NUM_USERS,
    spinsPerUser: SPINS_PER_USER,
    startingCredits: STARTING_CREDITS,
  },
  summary: {
    totalUsers: 0,
    totalSpins: 0,
    totalBet: 0,
    totalWon: 0,
    totalLost: 0,
    netResult: 0,
    rtp: 0,
    features: {
      freeSpinsTriggered: 0,
      holdAndSpinTriggered: 0,
    },
    bigWins: 0,
    megaWins: 0,
    jackpots: 0,
  },
  users: [],
};

// Per-user detailed logs
const spinLogs = [];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatNumber(n) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function progressBar(current, total, width = 40) {
  const percent = current / total;
  const filled = Math.round(width * percent);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${(percent * 100).toFixed(1)}%`;
}

async function simulateUser(userIndex) {
  const userId = uuidv4();
  
  // Assign random betting preferences for this user
  const betPerLine = randomChoice(AVAILABLE_BETS);
  const lines = randomChoice(AVAILABLE_LINES);
  const totalBetPerSpin = betPerLine * lines;
  
  const userStats = {
    userId,
    userIndex: userIndex + 1,
    betPerLine,
    lines,
    totalBetPerSpin,
    startingCredits: STARTING_CREDITS,
    spins: 0,
    totalBet: 0,
    totalWon: 0,
    wins: 0,
    losses: 0,
    features: {
      freeSpins: 0,
      holdAndSpin: 0,
    },
    biggestWin: 0,
    finalCredits: STARTING_CREDITS,
  };

  let credits = STARTING_CREDITS;
  let spinCount = 0;

  while (spinCount < SPINS_PER_USER && credits >= totalBetPerSpin) {
    // Deduct bet
    credits -= totalBetPerSpin;
    userStats.totalBet += totalBetPerSpin;
    
    // Play round
    const result = game.playRound(betPerLine, lines);
    
    // Add winnings
    credits += result.totalWin;
    userStats.totalWon += result.totalWin;
    
    if (result.totalWin > 0) {
      userStats.wins++;
      if (result.totalWin > userStats.biggestWin) {
        userStats.biggestWin = result.totalWin;
      }
    } else {
      userStats.losses++;
    }
    
    // Track features
    if (result.freeSpinsTrigger?.triggered) {
      userStats.features.freeSpins++;
      results.summary.features.freeSpinsTriggered++;
      
      // Simulate free spins
      let freeSpinsRemaining = result.freeSpinsTrigger.spins;
      while (freeSpinsRemaining > 0) {
        const freeResult = game.playRound(betPerLine, lines, { isFreeSpin: true });
        credits += freeResult.totalWin;
        userStats.totalWon += freeResult.totalWin;
        
        if (freeResult.totalWin > userStats.biggestWin) {
          userStats.biggestWin = freeResult.totalWin;
        }
        
        // Check for retrigger
        if (freeResult.freeSpinsTrigger?.triggered) {
          freeSpinsRemaining += freeResult.freeSpinsTrigger.spins;
        }
        
        freeSpinsRemaining--;
      }
    }
    
    if (result.holdAndSpinTrigger?.triggered) {
      userStats.features.holdAndSpin++;
      results.summary.features.holdAndSpinTriggered++;
      
      // Simulate hold and spin (simplified - just award a random payout)
      // In reality this would involve multiple respins
      const hsSymbols = result.holdAndSpinTrigger.positions.length;
      let heldCount = hsSymbols;
      let spinsRemaining = 3;
      
      // Simulate respins
      while (spinsRemaining > 0 && heldCount < 15) {
        // ~15% chance to land another H&S symbol per empty position
        const emptyPositions = 15 - heldCount;
        for (let i = 0; i < emptyPositions; i++) {
          if (Math.random() < 0.15) {
            heldCount++;
            spinsRemaining = 3; // Reset
          }
        }
        spinsRemaining--;
      }
      
      // Calculate H&S payout based on symbols collected
      const hsResult = game.calculateHoldAndSpinPayout(heldCount, totalBetPerSpin);
      credits += hsResult.payout;
      userStats.totalWon += hsResult.payout;
      
      if (hsResult.payout > userStats.biggestWin) {
        userStats.biggestWin = hsResult.payout;
      }
    }
    
    // Track big wins
    const winMultiplier = result.totalWin / totalBetPerSpin;
    if (winMultiplier >= 100) {
      results.summary.jackpots++;
    } else if (winMultiplier >= 30) {
      results.summary.megaWins++;
    } else if (winMultiplier >= 15) {
      results.summary.bigWins++;
    }
    
    // Log individual spin
    spinLogs.push({
      userIndex: userIndex + 1,
      spin: spinCount + 1,
      betPerLine,
      lines,
      totalBet: totalBetPerSpin,
      win: result.totalWin,
      netResult: result.totalWin - totalBetPerSpin,
      creditsAfter: credits,
      hasFeature: !!(result.freeSpinsTrigger?.triggered || result.holdAndSpinTrigger?.triggered),
    });
    
    spinCount++;
    userStats.spins++;
  }
  
  userStats.finalCredits = credits;
  userStats.netResult = credits - STARTING_CREDITS;
  userStats.rtp = userStats.totalBet > 0 ? (userStats.totalWon / userStats.totalBet * 100) : 0;
  
  return userStats;
}

async function runSimulation() {
  console.log('\n🎰 SLOT MACHINE SIMULATION');
  console.log('═'.repeat(50));
  console.log(`Users: ${NUM_USERS}`);
  console.log(`Spins per user: ${SPINS_PER_USER}`);
  console.log(`Starting credits: ${formatNumber(STARTING_CREDITS)}`);
  console.log(`Bet options: ${AVAILABLE_BETS.join(', ')}`);
  console.log(`Line options: ${AVAILABLE_LINES.join(', ')}`);
  console.log('═'.repeat(50));
  console.log('\nRunning simulation...\n');
  
  const startTime = Date.now();
  
  for (let i = 0; i < NUM_USERS; i++) {
    const userStats = await simulateUser(i);
    results.users.push(userStats);
    
    // Update summary
    results.summary.totalSpins += userStats.spins;
    results.summary.totalBet += userStats.totalBet;
    results.summary.totalWon += userStats.totalWon;
    
    // Progress update every 10 users
    if ((i + 1) % 10 === 0 || i === NUM_USERS - 1) {
      process.stdout.write(`\r  ${progressBar(i + 1, NUM_USERS)} Users: ${i + 1}/${NUM_USERS}`);
    }
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Calculate final summary
  results.summary.totalUsers = NUM_USERS;
  results.summary.totalLost = results.summary.totalBet - results.summary.totalWon;
  results.summary.netResult = results.summary.totalWon - results.summary.totalBet;
  results.summary.rtp = (results.summary.totalWon / results.summary.totalBet * 100);
  results.endTime = new Date().toISOString();
  results.elapsedSeconds = parseFloat(elapsed);
  
  console.log('\n\n');
  console.log('═'.repeat(50));
  console.log('📊 SIMULATION RESULTS');
  console.log('═'.repeat(50));
  console.log(`\nCompleted in ${elapsed}s`);
  console.log(`Total spins: ${formatNumber(results.summary.totalSpins)}`);
  console.log(`Total wagered: ${formatNumber(results.summary.totalBet)}`);
  console.log(`Total won: ${formatNumber(results.summary.totalWon)}`);
  console.log(`House edge: ${formatNumber(results.summary.totalLost)} (${((results.summary.totalLost / results.summary.totalBet) * 100).toFixed(2)}%)`);
  console.log(`\n🎯 ACTUAL RTP: ${results.summary.rtp.toFixed(4)}%`);
  console.log(`   Target RTP: 98%`);
  console.log(`   Variance: ${(results.summary.rtp - 98).toFixed(4)}%`);
  
  console.log('\n📈 FEATURES TRIGGERED:');
  console.log(`   Free Spins: ${formatNumber(results.summary.features.freeSpinsTriggered)}`);
  console.log(`   Hold & Spin: ${formatNumber(results.summary.features.holdAndSpinTriggered)}`);
  
  console.log('\n🏆 BIG WINS:');
  console.log(`   15x+ (Big): ${formatNumber(results.summary.bigWins)}`);
  console.log(`   30x+ (Mega): ${formatNumber(results.summary.megaWins)}`);
  console.log(`   100x+ (Jackpot): ${formatNumber(results.summary.jackpots)}`);
  
  // User distribution by final result
  const winners = results.users.filter(u => u.netResult > 0).length;
  const losers = results.users.filter(u => u.netResult < 0).length;
  const breakeven = results.users.filter(u => u.netResult === 0).length;
  
  console.log('\n👥 USER OUTCOMES:');
  console.log(`   Winners: ${winners} (${(winners/NUM_USERS*100).toFixed(1)}%)`);
  console.log(`   Losers: ${losers} (${(losers/NUM_USERS*100).toFixed(1)}%)`);
  console.log(`   Breakeven: ${breakeven} (${(breakeven/NUM_USERS*100).toFixed(1)}%)`);
  
  // RTP by bet level
  console.log('\n📊 RTP BY BET LEVEL:');
  for (const bet of AVAILABLE_BETS) {
    const betUsers = results.users.filter(u => u.betPerLine === bet);
    if (betUsers.length > 0) {
      const betTotal = betUsers.reduce((sum, u) => sum + u.totalBet, 0);
      const winTotal = betUsers.reduce((sum, u) => sum + u.totalWon, 0);
      const rtp = (winTotal / betTotal * 100).toFixed(2);
      console.log(`   Bet ${bet}: ${rtp}% (${betUsers.length} users)`);
    }
  }
  
  // Save results
  const outputDir = path.join(__dirname, '..', 'simulation-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Summary JSON
  const summaryPath = path.join(outputDir, `summary-${timestamp}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Summary saved: ${summaryPath}`);
  
  // Detailed spin log CSV
  const csvPath = path.join(outputDir, `spins-${timestamp}.csv`);
  const csvHeader = 'user,spin,bet_per_line,lines,total_bet,win,net_result,credits_after,has_feature\n';
  const csvRows = spinLogs.map(s => 
    `${s.userIndex},${s.spin},${s.betPerLine},${s.lines},${s.totalBet},${s.win},${s.netResult},${s.creditsAfter},${s.hasFeature}`
  ).join('\n');
  fs.writeFileSync(csvPath, csvHeader + csvRows);
  console.log(`💾 Spin log saved: ${csvPath}`);
  
  // User summary CSV
  const userCsvPath = path.join(outputDir, `users-${timestamp}.csv`);
  const userHeader = 'user,bet_per_line,lines,spins,total_bet,total_won,wins,losses,free_spins,hold_spin,biggest_win,final_credits,net_result,rtp\n';
  const userRows = results.users.map(u =>
    `${u.userIndex},${u.betPerLine},${u.lines},${u.spins},${u.totalBet},${u.totalWon},${u.wins},${u.losses},${u.features.freeSpins},${u.features.holdAndSpin},${u.biggestWin},${u.finalCredits},${u.netResult},${u.rtp.toFixed(2)}`
  ).join('\n');
  fs.writeFileSync(userCsvPath, userHeader + userRows);
  console.log(`💾 User summary saved: ${userCsvPath}`);
  
  console.log('\n✅ Simulation complete!\n');
}

// Run it
runSimulation().catch(err => {
  console.error('Simulation failed:', err);
  process.exit(1);
});
