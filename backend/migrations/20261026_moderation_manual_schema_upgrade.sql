-- Upgrade the simplified moderation tables created manually in phpMyAdmin.
-- Run ONLY if you created the tables using the earlier short SQL script.
-- Do not run this on a database where the repository migration already created the full schema.

ALTER TABLE moderation_roles
  ADD COLUMN granted_by INT NULL,
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE moderation_sanctions
  CHANGE COLUMN user_id target_user_id INT NOT NULL,
  CHANGE COLUMN moderator_id actor_user_id INT NOT NULL,
  CHANGE COLUMN type action VARCHAR(32) NOT NULL,
  ADD COLUMN revoked_at DATETIME NULL,
  ADD COLUMN revoked_by INT NULL;

ALTER TABLE moderation_audit
  CHANGE COLUMN moderator_id actor_user_id INT NOT NULL,
  CHANGE COLUMN details metadata_json TEXT NULL,
  ADD COLUMN reason TEXT NULL;

ALTER TABLE moderation_ip_bans
  ADD COLUMN user_id INT NULL,
  CHANGE COLUMN moderator_id actor_user_id INT NOT NULL;
