-- MySQL dump 10.13  Distrib 9.6.0, for macos15.7 (arm64)
--
-- Host: localhost    Database: slots_game
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `daily_stats`
--

DROP TABLE IF EXISTS `daily_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_stats` (
  `date` date NOT NULL,
  `total_spins` bigint DEFAULT '0',
  `total_wagered` bigint DEFAULT '0',
  `total_won` bigint DEFAULT '0',
  `unique_players` int DEFAULT '0',
  `free_spins_triggered` int DEFAULT '0',
  `hold_spin_triggered` int DEFAULT '0',
  `jackpots_won` int DEFAULT '0',
  PRIMARY KEY (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feature_sessions`
--

DROP TABLE IF EXISTS `feature_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feature_sessions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `feature_type` enum('free_spins','hold_and_spin') NOT NULL,
  `triggered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `initial_spins` int DEFAULT NULL,
  `spins_remaining` int DEFAULT NULL,
  `total_win` bigint DEFAULT '0',
  `multiplier` decimal(5,2) DEFAULT '1.00',
  `state` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_features` (`user_id`,`triggered_at`),
  CONSTRAINT `feature_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `game_sessions`
--

DROP TABLE IF EXISTS `game_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_sessions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` timestamp NULL DEFAULT NULL,
  `starting_credits` bigint DEFAULT NULL,
  `ending_credits` bigint DEFAULT NULL,
  `total_spins` int DEFAULT '0',
  `total_wagered` bigint DEFAULT '0',
  `total_won` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_user_session` (`user_id`,`started_at`),
  CONSTRAINT `game_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `jackpot_history`
--

DROP TABLE IF EXISTS `jackpot_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jackpot_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) NOT NULL,
  `bet_level` int NOT NULL,
  `jackpot_type` enum('mini','minor','major','grand') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `won_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_type` (`jackpot_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `jackpot_wins`
--

DROP TABLE IF EXISTS `jackpot_wins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jackpot_wins` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) NOT NULL,
  `jackpot_type` enum('mini','minor','major','grand') NOT NULL,
  `amount` bigint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_jackpot_type` (`jackpot_type`,`created_at`),
  CONSTRAINT `jackpot_wins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `leaderboard`
--

DROP TABLE IF EXISTS `leaderboard`;
/*!50001 DROP VIEW IF EXISTS `leaderboard`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `leaderboard` AS SELECT 
 1 AS `id`,
 1 AS `username`,
 1 AS `credits`,
 1 AS `total_won`,
 1 AS `biggest_win`,
 1 AS `total_spins`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `progressive_jackpots`
--

DROP TABLE IF EXISTS `progressive_jackpots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `progressive_jackpots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bet_level` int NOT NULL,
  `jackpot_type` enum('mini','minor','major','grand') NOT NULL,
  `current_value` decimal(15,2) NOT NULL,
  `initial_value` decimal(15,2) NOT NULL,
  `max_value` decimal(15,2) NOT NULL,
  `last_won_at` timestamp NULL DEFAULT NULL,
  `last_won_by` varchar(36) DEFAULT NULL,
  `last_won_amount` decimal(15,2) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_jackpot` (`bet_level`,`jackpot_type`),
  KEY `idx_bet_level` (`bet_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spin_history`
--

DROP TABLE IF EXISTS `spin_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spin_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) NOT NULL,
  `session_id` varchar(36) DEFAULT NULL,
  `spin_type` enum('normal','free_spin','hold_and_spin') DEFAULT 'normal',
  `bet_per_line` int DEFAULT NULL,
  `lines_played` int DEFAULT NULL,
  `total_bet` bigint DEFAULT NULL,
  `total_win` bigint DEFAULT NULL,
  `reel_result` json DEFAULT NULL,
  `winning_lines` json DEFAULT NULL,
  `feature_triggered` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_spins` (`user_id`,`created_at`),
  KEY `idx_session_spins` (`session_id`),
  CONSTRAINT `spin_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `credits` bigint DEFAULT '1000',
  `total_wagered` bigint DEFAULT '0',
  `total_won` bigint DEFAULT '0',
  `total_spins` int DEFAULT '0',
  `biggest_win` bigint DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_username` (`username`),
  KEY `idx_credits` (`credits`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Final view structure for view `leaderboard`
--

/*!50001 DROP VIEW IF EXISTS `leaderboard`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `leaderboard` AS select `users`.`id` AS `id`,`users`.`username` AS `username`,`users`.`credits` AS `credits`,`users`.`total_won` AS `total_won`,`users`.`biggest_win` AS `biggest_win`,`users`.`total_spins` AS `total_spins` from `users` order by `users`.`credits` desc limit 100 */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-03  1:01:49
