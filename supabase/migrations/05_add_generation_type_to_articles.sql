-- Add generation_type column to articles table
-- This column will distinguish between manual generation and scheduled/cron-based generation

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS generation_type VARCHAR(50) DEFAULT 'manual'
CHECK (generation_type IN ('manual', 'scheduled', 'cron'));

-- Update existing records to have 'manual' as default generation type
UPDATE articles
SET generation_type = 'manual'
WHERE generation_type IS NULL;

-- Add index for better query performance on generation_type
CREATE INDEX IF NOT EXISTS idx_articles_generation_type ON articles(generation_type);

-- Add composite index for scheduled articles queries
CREATE INDEX IF NOT EXISTS idx_articles_scheduled_generation ON articles(generation_type, scheduled_at)
WHERE generation_type IN ('scheduled', 'cron');

-- Update the updated_at timestamp for existing records
UPDATE articles
SET updated_at = NOW()
WHERE generation_type = 'manual';