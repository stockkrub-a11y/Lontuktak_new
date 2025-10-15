-- Add missing columns to existing stock_notifications table
ALTER TABLE stock_notifications 
ADD COLUMN IF NOT EXISTS unchanged_counter NUMERIC(10, 2) DEFAULT 0;

ALTER TABLE stock_notifications 
ADD COLUMN IF NOT EXISTS flag VARCHAR(50) DEFAULT 'stage';

-- Create index for flag column
CREATE INDEX IF NOT EXISTS idx_stock_notifications_flag 
ON stock_notifications(flag);
