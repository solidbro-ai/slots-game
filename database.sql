-- Slots Game Database Schema
-- Run this to set up your MySQL database

CREATE DATABASE IF NOT EXISTS slots_game;
USE slots_game;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255),
  credits BIGINT DEFAULT 1000,
  total_wagered BIGINT DEFAULT 0,
  total_won BIGINT DEFAULT 0,
  total_spins INT DEFAULT 0,
  biggest_win BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEX idx_username (username),
  INDEX idx_credits (credits)
);

-- Game sessions (for tracking individual play sessions)
CREATE TABLE IF NOT EXISTS game_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  starting_credits BIGINT,
  ending_credits BIGINT,
  total_spins INT DEFAULT 0,
  total_wagered BIGINT DEFAULT 0,
  total_won BIGINT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_session (user_id, started_at)
);

-- Spin history (detailed record of each spin)
CREATE TABLE IF NOT EXISTS spin_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36),
  spin_type ENUM('normal', 'free_spin', 'hold_and_spin') DEFAULT 'normal',
  bet_per_line INT,
  lines_played INT,
  total_bet BIGINT,
  total_win BIGINT,
  reel_result JSON,
  winning_lines JSON,
  feature_triggered VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_spins (user_id, created_at),
  INDEX idx_session_spins (session_id)
);

-- Feature tracking (free spins and hold & spin sessions)
CREATE TABLE IF NOT EXISTS feature_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  feature_type ENUM('free_spins', 'hold_and_spin') NOT NULL,
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  initial_spins INT,
  spins_remaining INT,
  total_win BIGINT DEFAULT 0,
  multiplier DECIMAL(5,2) DEFAULT 1.00,
  state JSON,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_features (user_id, triggered_at)
);

-- Jackpot history
CREATE TABLE IF NOT EXISTS jackpot_wins (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  jackpot_type ENUM('mini', 'minor', 'major', 'grand') NOT NULL,
  amount BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_jackpot_type (jackpot_type, created_at)
);

-- Daily stats (for analytics)
CREATE TABLE IF NOT EXISTS daily_stats (
  date DATE PRIMARY KEY,
  total_spins BIGINT DEFAULT 0,
  total_wagered BIGINT DEFAULT 0,
  total_won BIGINT DEFAULT 0,
  unique_players INT DEFAULT 0,
  free_spins_triggered INT DEFAULT 0,
  hold_spin_triggered INT DEFAULT 0,
  jackpots_won INT DEFAULT 0
);

-- Leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  id,
  username,
  credits,
  total_won,
  biggest_win,
  total_spins
FROM users
ORDER BY credits DESC
LIMIT 100;
