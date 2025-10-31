-- Enable Realtime for CRUD tables
-- This migration enables PostgreSQL Realtime for the main tables used in the application

-- Enable realtime for websites table
ALTER PUBLICATION supabase_realtime ADD TABLE websites;

-- Enable realtime for articles table
ALTER PUBLICATION supabase_realtime ADD TABLE articles;

-- Enable realtime for webhooks table
ALTER PUBLICATION supabase_realtime ADD TABLE webhooks;

-- Enable realtime for workflows table
ALTER PUBLICATION supabase_realtime ADD TABLE workflows;

-- Enable realtime for published_articles table
ALTER PUBLICATION supabase_realtime ADD TABLE published_articles;

-- Enable realtime for ai_prompts table
ALTER PUBLICATION supabase_realtime ADD TABLE ai_prompts;

-- Enable realtime for system_logs table (for monitoring)
ALTER PUBLICATION supabase_realtime ADD TABLE system_logs;

-- Add Row Level Security (RLS) policies for realtime access
-- These policies ensure users can only subscribe to their own data changes

-- Websites RLS for realtime
CREATE POLICY "Users can listen to their own websites changes" ON websites
FOR SELECT USING (auth.uid() = user_id);

-- Articles RLS for realtime
CREATE POLICY "Users can listen to their own articles changes" ON articles
FOR SELECT USING (auth.uid() = user_id);

-- Webhooks RLS for realtime
CREATE POLICY "Users can listen to their own webhooks changes" ON webhooks
FOR SELECT USING (auth.uid() = user_id);

-- Workflows RLS for realtime
CREATE POLICY "Users can listen to their own workflows changes" ON workflows
FOR SELECT USING (auth.uid() = user_id);

-- Published articles RLS for realtime
CREATE POLICY "Users can listen to their own published articles changes" ON published_articles
FOR SELECT USING (auth.uid() = user_id);

-- AI Prompts RLS for realtime
CREATE POLICY "Users can listen to their own AI prompts changes" ON ai_prompts
FOR SELECT USING (auth.uid() = user_id);

-- System logs are typically read-only for all authenticated users (or admin only)
-- For now, allow all authenticated users to see system logs
CREATE POLICY "Authenticated users can listen to system logs" ON system_logs
FOR SELECT USING (auth.role() = 'authenticated');