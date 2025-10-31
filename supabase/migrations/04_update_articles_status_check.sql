-- Update the check constraint on the articles table to include all valid statuses

-- First, get the current constraint information
-- Then drop and recreate the constraint with the new allowed values

ALTER TABLE articles 
DROP CONSTRAINT IF EXISTS articles_status_check,
ADD CONSTRAINT articles_status_check CHECK (status IN ('pending', 'processing', 'posted', 'failed', 'draft', 'scheduled', 'published', 'archived'));