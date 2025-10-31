-- Create system_logs table for comprehensive logging
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(10) NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
    message TEXT NOT NULL,
    source VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes separately after table creation
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_source ON system_logs(source);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

-- Create function for automatic log cleanup (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_system_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM system_logs
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Enable Row Level Security
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can see their own logs and system logs
CREATE POLICY "Users can view their own logs and system logs" ON system_logs
    FOR SELECT USING (
        user_id IS NULL OR
        user_id = auth.uid()
    );

-- Service role can insert logs (for system processes)
CREATE POLICY "Service role can insert logs" ON system_logs
    FOR INSERT WITH CHECK (
        true
    );

-- Users cannot update logs (immutable)
CREATE POLICY "Users cannot update logs" ON system_logs
    FOR UPDATE USING (false);

-- Users cannot delete logs
CREATE POLICY "Users cannot delete logs" ON system_logs
    FOR DELETE USING (false);

-- Grant permissions
GRANT SELECT, INSERT ON system_logs TO authenticated;
GRANT ALL ON system_logs TO service_role;

-- Create scheduled job for cleanup (requires pg_cron extension)
-- Uncomment if you have pg_cron installed
-- SELECT cron.schedule('cleanup-system-logs', '0 2 * * *', 'SELECT cleanup_old_system_logs();');