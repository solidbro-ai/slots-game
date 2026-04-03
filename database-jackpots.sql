-- Progressive Jackpots Schema (scaled by 50 for max lines)
-- 5 bet tiers × 4 jackpot levels = 20 jackpots

USE slots_game;

CREATE TABLE IF NOT EXISTS progressive_jackpots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bet_level INT NOT NULL,           -- 1, 5, 25, 125, 500
  jackpot_type ENUM('mini', 'minor', 'major', 'grand') NOT NULL,
  current_value DECIMAL(15,2) NOT NULL,
  initial_value DECIMAL(15,2) NOT NULL,
  max_value DECIMAL(15,2) NOT NULL,
  last_won_at TIMESTAMP NULL,
  last_won_by VARCHAR(36) NULL,
  last_won_amount DECIMAL(15,2) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_jackpot (bet_level, jackpot_type),
  INDEX idx_bet_level (bet_level)
);

-- Initialize jackpots for all bet levels (×50 for lines)
-- Mini: 250x initial, 1000x max (was 5/20)
-- Minor: 500x initial, 2500x max (was 10/50)
-- Major: 5000x initial, 25000x max (was 100/500)
-- Grand: 50000x initial, 250000x max (was 1000/5000)

INSERT INTO progressive_jackpots (bet_level, jackpot_type, current_value, initial_value, max_value) VALUES
-- Bet level 1
(1, 'mini', 250, 250, 1000),
(1, 'minor', 500, 500, 2500),
(1, 'major', 5000, 5000, 25000),
(1, 'grand', 50000, 50000, 250000),
-- Bet level 5
(5, 'mini', 1250, 1250, 5000),
(5, 'minor', 2500, 2500, 12500),
(5, 'major', 25000, 25000, 125000),
(5, 'grand', 250000, 250000, 1250000),
-- Bet level 25
(25, 'mini', 6250, 6250, 25000),
(25, 'minor', 12500, 12500, 62500),
(25, 'major', 125000, 125000, 625000),
(25, 'grand', 1250000, 1250000, 6250000),
-- Bet level 125
(125, 'mini', 31250, 31250, 125000),
(125, 'minor', 62500, 62500, 312500),
(125, 'major', 625000, 625000, 3125000),
(125, 'grand', 6250000, 6250000, 31250000),
-- Bet level 500
(500, 'mini', 125000, 125000, 500000),
(500, 'minor', 250000, 250000, 1250000),
(500, 'major', 2500000, 2500000, 12500000),
(500, 'grand', 25000000, 25000000, 125000000)
ON DUPLICATE KEY UPDATE 
  current_value = VALUES(current_value),
  initial_value = VALUES(initial_value),
  max_value = VALUES(max_value);

-- Jackpot win history
CREATE TABLE IF NOT EXISTS jackpot_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  bet_level INT NOT NULL,
  jackpot_type ENUM('mini', 'minor', 'major', 'grand') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_type (jackpot_type)
);
