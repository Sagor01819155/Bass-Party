-- Bass Party - Complete MySQL Database Schema
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB, InfinityFree (free.nf), cPanel, and phpMyAdmin

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Table: users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(32) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `avatar` TEXT NULL,
  `is_verified` TINYINT(1) DEFAULT 0,
  `verification_code` VARCHAR(10) NULL,
  `is_admin` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`email`),
  INDEX (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: rooms
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_id` VARCHAR(64) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `owner_id` VARCHAR(32) NOT NULL,
  `owner_name` VARCHAR(100) NOT NULL,
  `current_video_id` VARCHAR(64) DEFAULT 'jfKfPfyJRdk',
  `current_title` VARCHAR(255) DEFAULT 'Lofi Hip Hop Radio',
  `is_playing` TINYINT(1) DEFAULT 0,
  `current_time` FLOAT DEFAULT 0,
  `last_synced_at` BIGINT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`room_id`),
  INDEX (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: room_members
CREATE TABLE IF NOT EXISTS `room_members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(32) NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `user_avatar` TEXT NULL,
  `is_admin` TINYINT(1) DEFAULT 0,
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`room_id`),
  INDEX (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: friends
CREATE TABLE IF NOT EXISTS `friends` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(32) NOT NULL,
  `friend_id` VARCHAR(32) NOT NULL,
  `friend_name` VARCHAR(100) NOT NULL,
  `friend_avatar` TEXT NULL,
  `status` ENUM('pending', 'accepted') DEFAULT 'accepted',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`user_id`),
  INDEX (`friend_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table: room_invites
CREATE TABLE IF NOT EXISTS `room_invites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_id` VARCHAR(64) NOT NULL,
  `room_password` VARCHAR(255) NOT NULL,
  `from_user_id` VARCHAR(32) NOT NULL,
  `from_user_name` VARCHAR(100) NOT NULL,
  `to_user_id` VARCHAR(32) NOT NULL,
  `status` ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`to_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table: site_settings
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(64) NOT NULL UNIQUE,
  `setting_value` TEXT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default Settings Seed
INSERT INTO `site_settings` (`setting_key`, `setting_value`) VALUES
('site_name', 'Bass Party'),
('site_logo', '🎵 Bass Party'),
('site_url', 'https://bassparty.free.nf'),
('accent_color', '#a855f7'),
('emailjs_service_id', 'service_bassparty'),
('emailjs_template_id', 'template_verification'),
('emailjs_public_key', 'user_public_key_here')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- Default Admin Account (mdsagorirfan@gmail.com / Sagor9155)
-- Password hash generated with password_hash('Sagor9155', PASSWORD_BCRYPT)
INSERT INTO `users` (`user_id`, `name`, `email`, `password`, `is_verified`, `is_admin`) VALUES
('BP-ADMIN01', 'Admin Sagor', 'mdsagorirfan@gmail.com', '$2y$10$wE9sUj34W4tJ8k7tLgE5.uGqJz2YnB2P0N4yv1tLd2O.Ew1K2vJma', 1, 1)
ON DUPLICATE KEY UPDATE `is_admin` = 1, `is_verified` = 1;

SET FOREIGN_KEY_CHECKS = 1;
