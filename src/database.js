/**
 * Database Module
 * MySQL connection and query helpers
 */

const mysql = require('mysql2/promise');
const config = require('../config/game.config');

let pool = null;

/**
 * Initialize database connection pool
 */
async function init() {
  const config = {
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'slots_game',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  // Use socket if available, otherwise TCP
  if (process.env.DB_SOCKET) {
    config.socketPath = process.env.DB_SOCKET;
  } else {
    config.host = process.env.DB_HOST || 'localhost';
    config.port = process.env.DB_PORT || 3306;
  }

  pool = mysql.createPool(config);

  // Test connection
  try {
    const connection = await pool.getConnection();
    console.log('✓ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    throw error;
  }

  return pool;
}

/**
 * Get connection pool
 */
function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call init() first.');
  }
  return pool;
}

/**
 * User operations
 */
const users = {
  async create(id, username = null, passwordHash = null) {
    const [result] = await pool.execute(
      'INSERT INTO users (id, username, password_hash, credits) VALUES (?, ?, ?, ?)',
      [id, username, passwordHash, config.defaultCredits]
    );
    return result;
  },

  async getById(id) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async getByUsername(username) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  },

  async updateCredits(id, credits) {
    const [result] = await pool.execute(
      'UPDATE users SET credits = ? WHERE id = ?',
      [credits, id]
    );
    return result;
  },

  async addCredits(id, amount) {
    const [result] = await pool.execute(
      'UPDATE users SET credits = credits + ? WHERE id = ?',
      [amount, id]
    );
    return result;
  },

  async deductCredits(id, amount) {
    const [result] = await pool.execute(
      'UPDATE users SET credits = credits - ? WHERE id = ? AND credits >= ?',
      [amount, id, amount]
    );
    return result.affectedRows > 0;
  },

  async updateStats(id, wagered, won) {
    const [result] = await pool.execute(
      `UPDATE users SET 
        total_wagered = total_wagered + ?,
        total_won = total_won + ?,
        total_spins = total_spins + 1,
        biggest_win = GREATEST(biggest_win, ?)
      WHERE id = ?`,
      [wagered, won, won, id]
    );
    return result;
  },

  async getCredits(id) {
    const [rows] = await pool.execute('SELECT credits FROM users WHERE id = ?', [id]);
    return rows[0]?.credits ?? null;
  },

  async getLeaderboard(limit = 10) {
    const [rows] = await pool.execute(
      'SELECT username, credits, biggest_win FROM users ORDER BY credits DESC LIMIT ?',
      [limit]
    );
    return rows;
  },
};

/**
 * Spin history operations
 */
const spins = {
  async record(spinData) {
    const [result] = await pool.execute(
      `INSERT INTO spin_history 
        (user_id, session_id, spin_type, bet_per_line, lines_played, total_bet, total_win, reel_result, winning_lines, feature_triggered)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        spinData.userId,
        spinData.sessionId || null,
        spinData.spinType || 'normal',
        spinData.betPerLine,
        spinData.linesPlayed,
        spinData.totalBet,
        spinData.totalWin,
        JSON.stringify(spinData.reelResult),
        JSON.stringify(spinData.winningLines),
        spinData.featureTriggered || null,
      ]
    );
    return result;
  },

  async getHistory(userId, limit = 50) {
    const [rows] = await pool.execute(
      'SELECT * FROM spin_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    return rows;
  },
};

/**
 * Feature session operations
 */
const features = {
  async create(featureData) {
    const [result] = await pool.execute(
      `INSERT INTO feature_sessions 
        (id, user_id, feature_type, initial_spins, spins_remaining, multiplier, state)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        featureData.id,
        featureData.userId,
        featureData.featureType,
        featureData.initialSpins,
        featureData.spinsRemaining,
        featureData.multiplier || 1,
        JSON.stringify(featureData.state || {}),
      ]
    );
    return result;
  },

  async update(id, data) {
    const updates = [];
    const values = [];

    if (data.spinsRemaining !== undefined) {
      updates.push('spins_remaining = ?');
      values.push(data.spinsRemaining);
    }
    if (data.totalWin !== undefined) {
      updates.push('total_win = ?');
      values.push(data.totalWin);
    }
    if (data.state !== undefined) {
      updates.push('state = ?');
      values.push(JSON.stringify(data.state));
    }
    if (data.completed) {
      updates.push('completed_at = NOW()');
    }

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE feature_sessions SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return result;
  },

  async getActive(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM feature_sessions WHERE user_id = ? AND completed_at IS NULL ORDER BY triggered_at DESC LIMIT 1',
      [userId]
    );
    return rows[0] || null;
  },
};

module.exports = {
  init,
  getPool,
  users,
  spins,
  features,
};
