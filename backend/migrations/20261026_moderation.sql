-- Run once on the production MariaDB database.
-- Set GRINDLY_ADMIN_USER_IDS on the server to one or more trusted user IDs.
CREATE TABLE IF NOT EXISTS moderation_roles (
  user_id BIGINT NOT NULL PRIMARY KEY,
  role ENUM('moderator','admin','user') NOT NULL DEFAULT 'moderator',
  granted_by BIGINT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_moderation_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS moderation_sanctions (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  target_user_id BIGINT NOT NULL,
  actor_user_id BIGINT NOT NULL,
  action ENUM('warning','temp_ban','permanent_ban') NOT NULL,
  reason VARCHAR(500) NOT NULL,
  expires_at DATETIME NULL,
  revoked_at DATETIME NULL,
  revoked_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sanction_target (target_user_id, created_at),
  INDEX idx_sanction_active (target_user_id, action, revoked_at, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS moderation_audit (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_user_id BIGINT NOT NULL,
  target_user_id BIGINT NULL,
  action VARCHAR(40) NOT NULL,
  reason VARCHAR(500) NULL,
  metadata_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_target (target_user_id, created_at),
  INDEX idx_audit_actor (actor_user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS moderation_ip_bans (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  ip_hash CHAR(64) NOT NULL,
  reason VARCHAR(500) NOT NULL,
  actor_user_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME NULL,
  INDEX idx_ip_hash (ip_hash),
  INDEX idx_ip_user (user_id, revoked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
