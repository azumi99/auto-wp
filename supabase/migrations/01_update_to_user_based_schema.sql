-- Migration: Update schema from company-based to user-based system
-- This migration creates all necessary tables and transitions from company-based to user-based system

-- Create websites table if it doesn't exist (with the new user-based schema from QWEN.md)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'websites') THEN
        CREATE TABLE websites (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            url VARCHAR(500) NOT NULL,
            wp_username VARCHAR(255),
            wp_password TEXT, -- Should be encrypted
            wp_token TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Create webhooks table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'webhooks') THEN
        CREATE TABLE webhooks (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            url TEXT NOT NULL,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Create articles table if it doesn't exist (with the schema from QWEN.md) - no FK constraint initially
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'articles') THEN
        CREATE TABLE articles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            website_id UUID, -- Will add FK constraint after websites table is confirmed to exist
            user_id UUID NOT NULL, -- Will add FK constraint after the table is created
            title VARCHAR(500) NOT NULL,
            scheduled_at TIMESTAMP WITH TIME ZONE,
            status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'posted', 'failed')),
            webhook_id UUID, -- Will add FK constraint after webhooks table is confirmed to exist
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Create published_articles table if it doesn't exist - no FK constraints initially
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'published_articles') THEN
        CREATE TABLE published_articles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            article_id UUID, -- Will add FK constraint after articles table is confirmed to exist
            website_id UUID, -- Will add FK constraint after websites table is confirmed to exist
            user_id UUID NOT NULL, -- Will add FK constraint after auth.users is confirmed to exist
            title VARCHAR(500) NOT NULL,
            excerpt TEXT,
            image_url TEXT,
            post_url TEXT,
            published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Create ai_prompts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_prompts') THEN
        CREATE TABLE ai_prompts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            template TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Create workflows table if it doesn't exist - no FK constraints initially
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workflows') THEN
        CREATE TABLE workflows (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            website_id UUID, -- Will add FK constraint after websites table is confirmed to exist
            user_id UUID NOT NULL, -- Will add FK constraint after auth.users is confirmed to exist
            name VARCHAR(255) NOT NULL,
            description TEXT,
            schedule_type VARCHAR(50) CHECK (schedule_type IN ('manual', 'cron', 'interval')),
            schedule_config JSONB DEFAULT '{}',
            prompt_template_id UUID, -- Will add FK constraint after ai_prompts table is confirmed to exist
            webhook_url TEXT NOT NULL,
            is_active BOOLEAN DEFAULT true,
            last_run_at TIMESTAMP WITH TIME ZONE,
            next_run_at TIMESTAMP WITH TIME ZONE,
            success_count INTEGER DEFAULT 0,
            failure_count INTEGER DEFAULT 0,
            settings JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Create execution_logs table if it doesn't exist - no FK constraints initially
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'execution_logs') THEN
        CREATE TABLE execution_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            workflow_id UUID, -- Will add FK constraint after workflows table is confirmed to exist
            article_id UUID, -- Will add FK constraint after articles table is confirmed to exist
            status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed', 'cancelled')),
            trigger_type VARCHAR(50) CHECK (trigger_type IN ('manual', 'scheduled', 'webhook')),
            triggered_by UUID REFERENCES auth.users(id),
            execution_time_seconds INTEGER,
            cost_usd DECIMAL(10,4),
            error_message TEXT,
            error_code VARCHAR(100),
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE
        );
    END IF;
END
$$;

-- Update the articles table to add any missing columns if the table already existed
ALTER TABLE articles ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'posted', 'failed'));
ALTER TABLE articles ADD COLUMN IF NOT EXISTS webhook_id UUID;

-- Add missing columns to websites table as per QWEN.md schema (if the table existed)
ALTER TABLE websites ADD COLUMN IF NOT EXISTS wp_username VARCHAR(255);
ALTER TABLE websites ADD COLUMN IF NOT EXISTS wp_password TEXT; -- Should be encrypted
ALTER TABLE websites ADD COLUMN IF NOT EXISTS wp_token TEXT;

-- Add user_id column to other tables if not exists
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE execution_logs ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add updated_at column to published_articles if not exists
ALTER TABLE published_articles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Now that all tables are created, add the foreign key constraints
DO $$
BEGIN
    -- Add FK constraint for articles.website_id
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_articles_website_id' AND table_name = 'articles') THEN
        ALTER TABLE articles ADD CONSTRAINT fk_articles_website_id FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE;
    END IF;
    
    -- Add FK constraint for articles.user_id
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_articles_user_id' AND table_name = 'articles') THEN
        ALTER TABLE articles ADD CONSTRAINT fk_articles_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add FK constraint for articles.webhook_id (after webhooks table is confirmed to exist)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'webhooks')
    AND NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_articles_webhook_id' AND table_name = 'articles') THEN
        ALTER TABLE articles ADD CONSTRAINT fk_articles_webhook_id FOREIGN KEY (webhook_id) REFERENCES webhooks(id);
    END IF;
    
    -- Add FK constraints for published_articles
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'articles')
    AND NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_published_articles_article_id' AND table_name = 'published_articles') THEN
        ALTER TABLE published_articles ADD CONSTRAINT fk_published_articles_article_id FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'websites')
    AND NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_published_articles_website_id' AND table_name = 'published_articles') THEN
        ALTER TABLE published_articles ADD CONSTRAINT fk_published_articles_website_id FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_published_articles_user_id' AND table_name = 'published_articles') THEN
        ALTER TABLE published_articles ADD CONSTRAINT fk_published_articles_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add FK constraints for workflows
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_prompts')
    AND NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_workflows_prompt_template_id' AND table_name = 'workflows') THEN
        ALTER TABLE workflows ADD CONSTRAINT fk_workflows_prompt_template_id FOREIGN KEY (prompt_template_id) REFERENCES ai_prompts(id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'websites')
    AND NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_workflows_website_id' AND table_name = 'workflows') THEN
        ALTER TABLE workflows ADD CONSTRAINT fk_workflows_website_id FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_workflows_user_id' AND table_name = 'workflows') THEN
        ALTER TABLE workflows ADD CONSTRAINT fk_workflows_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add FK constraints for execution_logs
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workflows')
    AND NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_execution_logs_workflow_id' AND table_name = 'execution_logs') THEN
        ALTER TABLE execution_logs ADD CONSTRAINT fk_execution_logs_workflow_id FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'articles')
    AND NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_execution_logs_article_id' AND table_name = 'execution_logs') THEN
        ALTER TABLE execution_logs ADD CONSTRAINT fk_execution_logs_article_id FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_execution_logs_user_id' AND table_name = 'execution_logs') THEN
        ALTER TABLE execution_logs ADD CONSTRAINT fk_execution_logs_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add constraints for other tables that should exist
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_websites_user_id' AND table_name = 'websites') THEN
        ALTER TABLE websites ADD CONSTRAINT fk_websites_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_ai_prompts_user_id' AND table_name = 'ai_prompts') THEN
        ALTER TABLE ai_prompts ADD CONSTRAINT fk_ai_prompts_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_webhooks_user_id' AND table_name = 'webhooks') THEN
        ALTER TABLE webhooks ADD CONSTRAINT fk_webhooks_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Ensure NOT NULL constraints for user_id
DO $$
BEGIN
    ALTER TABLE websites ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE articles ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE workflows ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE ai_prompts ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE execution_logs ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE webhooks ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE published_articles ALTER COLUMN user_id SET NOT NULL;
EXCEPTION 
    WHEN OTHERS THEN
        -- If there are existing records without user_id, we'll need to handle them first
        -- This assumes that the user_id has been populated for existing records
        RAISE;
END
$$;

-- Drop company-related columns if they exist
ALTER TABLE websites DROP COLUMN IF EXISTS company_id CASCADE;
ALTER TABLE articles DROP COLUMN IF EXISTS company_id CASCADE;
ALTER TABLE workflows DROP COLUMN IF EXISTS company_id CASCADE;
ALTER TABLE ai_prompts DROP COLUMN IF EXISTS company_id CASCADE;
ALTER TABLE execution_logs DROP COLUMN IF EXISTS company_id CASCADE;

-- Drop company-related tables if they exist
DROP TABLE IF EXISTS company_members CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Create function for updated_at triggers if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_websites_updated_at') THEN
        CREATE TRIGGER update_websites_updated_at 
            BEFORE UPDATE ON websites 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_articles_updated_at') THEN
        CREATE TRIGGER update_articles_updated_at 
            BEFORE UPDATE ON articles 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_workflows_updated_at') THEN
        CREATE TRIGGER update_workflows_updated_at 
            BEFORE UPDATE ON workflows 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_ai_prompts_updated_at') THEN
        CREATE TRIGGER update_ai_prompts_updated_at 
            BEFORE UPDATE ON ai_prompts 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_execution_logs_updated_at') THEN
        CREATE TRIGGER update_execution_logs_updated_at 
            BEFORE UPDATE ON execution_logs 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_webhooks_updated_at') THEN
        CREATE TRIGGER update_webhooks_updated_at 
            BEFORE UPDATE ON webhooks 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_published_articles_updated_at') THEN
        CREATE TRIGGER update_published_articles_updated_at 
            BEFORE UPDATE ON published_articles 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Ensure the tables are RLS enabled for row-level security
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_articles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to ensure users can only access their own data
CREATE POLICY "Users can view their own websites" ON websites
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own websites" ON websites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own websites" ON websites
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own websites" ON websites
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own articles" ON articles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own articles" ON articles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own articles" ON articles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own articles" ON articles
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own workflows" ON workflows
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own workflows" ON workflows
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own workflows" ON workflows
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workflows" ON workflows
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own AI prompts" ON ai_prompts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own AI prompts" ON ai_prompts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own AI prompts" ON ai_prompts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own AI prompts" ON ai_prompts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own execution logs" ON execution_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own execution logs" ON execution_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own execution logs" ON execution_logs
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own execution logs" ON execution_logs
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own webhooks" ON webhooks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own webhooks" ON webhooks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own webhooks" ON webhooks
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own webhooks" ON webhooks
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own published articles" ON published_articles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  
CREATE POLICY "Users can insert their own published articles" ON published_articles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
  
CREATE POLICY "Users can update their own published articles" ON published_articles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
  
CREATE POLICY "Users can delete their own published articles" ON published_articles
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());