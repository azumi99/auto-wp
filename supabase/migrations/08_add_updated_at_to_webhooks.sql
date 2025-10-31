-- Add updated_at column to webhooks table
ALTER TABLE webhooks ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();