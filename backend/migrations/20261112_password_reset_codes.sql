-- Local password recovery codes sent through the configured SMTP provider.
-- Only hashes are stored; flow identifiers and codes are never persisted in plain text.
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  flow_hash CHAR(64) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME NULL,
  UNIQUE KEY uq_password_reset_flow (flow_hash),
  INDEX idx_password_reset_user (user_id, created_at),
  INDEX idx_password_reset_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
