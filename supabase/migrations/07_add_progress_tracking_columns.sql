-- Migration: Add progress tracking columns to articles table
-- This migration adds columns for tracking article generation progress and animation

-- Add progress tracking columns to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS generation_progress INTEGER DEFAULT 0 CHECK (generation_progress >= 0 AND generation_progress <= 100);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS generation_message TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE;

-- Add result tracking columns
ALTER TABLE articles ADD COLUMN IF NOT EXISTS wp_post_id INTEGER;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS wp_post_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS word_count INTEGER;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS generation_time_seconds INTEGER;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better query performance on scheduled articles
CREATE INDEX IF NOT EXISTS idx_articles_scheduled_at_status ON articles(scheduled_at, status) WHERE status IN ('pending', 'scheduled', 'processing');
CREATE INDEX IF NOT EXISTS idx_articles_generation_type ON articles(generation_type) WHERE generation_type IN ('scheduled', 'cron');
CREATE INDEX IF NOT EXISTS idx_articles_user_scheduled ON articles(user_id, scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Add comment documentation
COMMENT ON COLUMN articles.generation_progress IS 'Progress percentage (0-100) for article generation animation';
COMMENT ON COLUMN articles.generation_message IS 'Current status message during generation';
COMMENT ON COLUMN articles.error_message IS 'Error message if generation failed';
COMMENT ON COLUMN articles.failed_at IS 'Timestamp when generation failed';
COMMENT ON COLUMN articles.wp_post_id IS 'WordPress post ID after successful publication';
COMMENT ON COLUMN articles.wp_post_url IS 'URL of the published WordPress post';
COMMENT ON COLUMN articles.word_count IS 'Word count of the generated article';
COMMENT ON COLUMN articles.generation_time_seconds IS 'Time taken to generate the article in seconds';
COMMENT ON COLUMN articles.published_at IS 'Timestamp when article was published to WordPress';

-- Create a function to automatically update generation_progress based on status
CREATE OR REPLACE FUNCTION update_generation_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-update progress based on status changes
    IF NEW.status = 'processing' AND OLD.status != 'processing' THEN
        NEW.generation_progress = 10;
        NEW.generation_message = 'Starting article generation...';
    ELSIF NEW.status = 'posted' AND OLD.status != 'posted' THEN
        NEW.generation_progress = 100;
        NEW.generation_message = 'Article successfully generated and posted!';
        NEW.published_at = NOW();
    ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        NEW.generation_progress = 0;
        NEW.failed_at = NOW();
    ELSIF NEW.status = 'pending' AND OLD.status = 'processing' THEN
        NEW.generation_progress = 0;
        NEW.generation_message = NULL;
    END IF;

    -- Always update the updated_at timestamp
    NEW.updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic progress updates
DROP TRIGGER IF EXISTS auto_update_generation_progress ON articles;
CREATE TRIGGER auto_update_generation_progress
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_generation_progress();

-- Add RLS policies for the new columns (they're covered by existing policies, but let's be explicit)
CREATE POLICY "Users can view generation progress on their own articles" ON articles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update generation progress on their own articles" ON articles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Log the migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 07_add_progress_tracking_columns.sql completed successfully';
END $$;