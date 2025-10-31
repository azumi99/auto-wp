-- Remove auto publish functionality from articles table

-- Drop the auto_publish column if it exists
ALTER TABLE articles
DROP COLUMN IF EXISTS auto_publish;

-- Drop the scheduled_datetime column if it exists (this was for auto publish scheduling)
-- Note: We keep scheduled_at column for article generation scheduling
ALTER TABLE articles
DROP COLUMN IF EXISTS scheduled_datetime;

-- Note: We can't reference auto_publish or scheduled_datetime columns here
-- because they are being dropped in this migration. The update statements
-- above that reference these columns are removed to prevent errors.