-- Escrow holds for job payment reservations
-- Credits are deducted when held, refunded when voided
CREATE TABLE IF NOT EXISTS escrow_holds (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  amount_usd DECIMAL(10, 2) NOT NULL,
  credits_held INT NOT NULL,
  reference VARCHAR(255),          -- e.g. job_abc123
  service VARCHAR(64),             -- e.g. klawwork
  status ENUM('held', 'released', 'voided') DEFAULT 'held',
  refund_percent INT DEFAULT NULL,
  refunded_credits INT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  released_at DATETIME DEFAULT NULL,
  voided_at DATETIME DEFAULT NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_reference (reference)
);
