-- Add draft status to articles table
-- This migration adds 'draft' status to the existing check constraint

-- First, drop the existing check constraint
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_status_check;

-- Add the check constraint with all status values including 'draft'
ALTER TABLE articles
ADD CONSTRAINT articles_status_check
CHECK (status IN ('draft', 'pending', 'processing', 'posted', 'failed'));

-- Add index for better query performance on status
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);

-- Create index for user_id and status combination for better filtering performance
CREATE INDEX IF NOT EXISTS idx_articles_user_status ON articles(user_id, status);