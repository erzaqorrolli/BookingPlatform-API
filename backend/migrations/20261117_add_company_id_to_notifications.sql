ALTER TABLE notifications
    ADD COLUMN company_id INT NULL AFTER user_id,
    ADD INDEX idx_notifications_user_company_created (user_id, company_id, created_at),
    ADD INDEX idx_notifications_user_company_read (user_id, company_id, read_at);
