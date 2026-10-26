-- Online presence heartbeat for the moderation dashboard.
-- Run once on the same MariaDB database used by Grindly.
CREATE TABLE IF NOT EXISTS moderation_presence (
  user_id BIGINT NOT NULL PRIMARY KEY,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_moderation_presence_seen (last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
