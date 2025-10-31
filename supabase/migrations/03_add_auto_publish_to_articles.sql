-- Add auto_publish column to articles table

ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_datetime TIMESTAMP WITH TIME ZONE;