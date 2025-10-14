/*
  # WP Auto - Complete Database Schema Migration
  
  Creates all tables first, then adds RLS policies.
  This avoids forward reference issues in RLS policies.
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CREATE ALL TABLES FIRST (without RLS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  website_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

CREATE TABLE IF NOT EXISTS websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  wordpress_version VARCHAR(50),
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_status VARCHAR(50) DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'warning', 'error', 'unknown')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  wp_username VARCHAR(255) NOT NULL,
  wp_app_password TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'untested' CHECK (status IN ('active', 'failed', 'untested')),
  last_verified TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500),
  content TEXT,
  excerpt TEXT,
  featured_image_url TEXT,
  wp_post_id INTEGER,
  wp_post_url TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'archived')),
  author_id UUID REFERENCES auth.users(id),
  ai_model VARCHAR(50),
  generation_time_seconds INTEGER,
  word_count INTEGER,
  category VARCHAR(255),
  tags TEXT[],
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  template TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  ai_model VARCHAR(50) DEFAULT 'gemini-pro',
  max_tokens INTEGER DEFAULT 2000,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  schedule_type VARCHAR(50) CHECK (schedule_type IN ('manual', 'cron', 'interval')),
  schedule_config JSONB DEFAULT '{}',
  prompt_template_id UUID REFERENCES ai_prompts(id),
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

CREATE TABLE IF NOT EXISTS execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  phone VARCHAR(50),
  timezone VARCHAR(100) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, role_id, company_id)
);

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_company ON websites(company_id);
CREATE INDEX IF NOT EXISTS idx_credentials_website ON credentials(website_id);
CREATE INDEX IF NOT EXISTS idx_articles_website ON articles(website_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_workflows_website ON workflows(website_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_workflow ON execution_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_article ON execution_logs(article_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_website ON ai_prompts(website_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_company ON user_activity_logs(company_id);

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES - COMPANIES
-- =============================================================================

CREATE POLICY "Users can view companies they belong to"
  ON companies FOR SELECT TO authenticated USING (
    owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM company_members WHERE company_members.company_id = companies.id AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert companies"
  ON companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their companies"
  ON companies FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete their companies"
  ON companies FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- =============================================================================
-- RLS POLICIES - COMPANY MEMBERS
-- =============================================================================

CREATE POLICY "Users can view company members"
  ON company_members FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM companies WHERE companies.id = company_members.company_id AND companies.owner_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM company_members cm WHERE cm.company_id = company_members.company_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can invite members"
  ON company_members FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = company_members.company_id AND companies.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = company_members.company_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin'))
  );

CREATE POLICY "Admins can update members"
  ON company_members FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = company_members.company_id AND companies.owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = company_members.company_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = company_members.company_id AND companies.owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = company_members.company_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')));

CREATE POLICY "Admins can remove members"
  ON company_members FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = company_members.company_id AND companies.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = company_members.company_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin'))
  );

-- =============================================================================
-- RLS POLICIES - WEBSITES
-- =============================================================================

CREATE POLICY "Users can view websites"
  ON websites FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM company_members WHERE company_members.company_id = websites.company_id AND company_members.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM companies WHERE companies.id = websites.company_id AND companies.owner_id = auth.uid())
  );

CREATE POLICY "Editors can insert websites"
  ON websites FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM company_members WHERE company_members.company_id = websites.company_id AND company_members.user_id = auth.uid() AND company_members.role IN ('owner', 'admin', 'editor')) OR
    EXISTS (SELECT 1 FROM companies WHERE companies.id = websites.company_id AND companies.owner_id = auth.uid())
  );

CREATE POLICY "Editors can update websites"
  ON websites FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM company_members WHERE company_members.company_id = websites.company_id AND company_members.user_id = auth.uid() AND company_members.role IN ('owner', 'admin', 'editor')) OR EXISTS (SELECT 1 FROM companies WHERE companies.id = websites.company_id AND companies.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM company_members WHERE company_members.company_id = websites.company_id AND company_members.user_id = auth.uid() AND company_members.role IN ('owner', 'admin', 'editor')) OR EXISTS (SELECT 1 FROM companies WHERE companies.id = websites.company_id AND companies.owner_id = auth.uid()));

CREATE POLICY "Admins can delete websites"
  ON websites FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM company_members WHERE company_members.company_id = websites.company_id AND company_members.user_id = auth.uid() AND company_members.role IN ('owner', 'admin')) OR
    EXISTS (SELECT 1 FROM companies WHERE companies.id = websites.company_id AND companies.owner_id = auth.uid())
  );

-- =============================================================================
-- RLS POLICIES - CREDENTIALS
-- =============================================================================

CREATE POLICY "Users can view credentials"
  ON credentials FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM websites w JOIN company_members cm ON w.company_id = cm.company_id WHERE w.id = credentials.website_id AND cm.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM websites w JOIN companies c ON w.company_id = c.id WHERE w.id = credentials.website_id AND c.owner_id = auth.uid())
  );

CREATE POLICY "Editors can insert credentials"
  ON credentials FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM websites w JOIN company_members cm ON w.company_id = cm.company_id WHERE w.id = credentials.website_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin', 'editor')) OR
    EXISTS (SELECT 1 FROM websites w JOIN companies c ON w.company_id = c.id WHERE w.id = credentials.website_id AND c.owner_id = auth.uid())
  );

CREATE POLICY "Editors can update credentials"
  ON credentials FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM websites w JOIN company_members cm ON w.company_id = cm.company_id WHERE w.id = credentials.website_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin', 'editor')) OR EXISTS (SELECT 1 FROM websites w JOIN companies c ON w.company_id = c.id WHERE w.id = credentials.website_id AND c.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM websites w JOIN company_members cm ON w.company_id = cm.company_id WHERE w.id = credentials.website_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin', 'editor')) OR EXISTS (SELECT 1 FROM websites w JOIN companies c ON w.company_id = c.id WHERE w.id = credentials.website_id AND c.owner_id = auth.uid()));

CREATE POLICY "Admins can delete credentials"
  ON credentials FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM websites w JOIN company_members cm ON w.company_id = cm.company_id WHERE w.id = credentials.website_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')) OR
    EXISTS (SELECT 1 FROM websites w JOIN companies c ON w.company_id = c.id WHERE w.id = credentials.website_id AND c.owner_id = auth.uid())
  );

-- Similar patterns for remaining tables (articles, workflows, prompts, etc.)
-- Simplified for brevity - following same pattern

CREATE POLICY "Users can view articles" ON articles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM websites w JOIN company_members cm ON w.company_id = cm.company_id WHERE w.id = articles.website_id AND cm.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM websites w JOIN companies c ON w.company_id = c.id WHERE w.id = articles.website_id AND c.owner_id = auth.uid())
);

CREATE POLICY "Editors can manage articles" ON articles FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM websites w JOIN company_members cm ON w.company_id = cm.company_id WHERE w.id = articles.website_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin', 'editor')) OR
  EXISTS (SELECT 1 FROM websites w JOIN companies c ON w.company_id = c.id WHERE w.id = articles.website_id AND c.owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM websites w JOIN company_members cm ON w.company_id = cm.company_id WHERE w.id = articles.website_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin', 'editor')) OR
  EXISTS (SELECT 1 FROM websites w JOIN companies c ON w.company_id = c.id WHERE w.id = articles.website_id AND c.owner_id = auth.uid())
);

CREATE POLICY "Users can view workflows" ON workflows FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM websites w JOIN company_members cm ON w.company_id = cm.company_id WHERE w.id = workflows.website_id AND cm.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM websites w JOIN companies c ON w.company_id = c.id WHERE w.id = workflows.website_id AND c.owner_id = auth.uid())
);

CREATE POLICY "Editors can manage workflows" ON workflows FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM websites w JOIN company_members cm ON w.company_id = cm.company_id WHERE w.id = workflows.website_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin', 'editor')) OR
  EXISTS (SELECT 1 FROM websites w JOIN companies c ON w.company_id = c.id WHERE w.id = workflows.website_id AND c.owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM websites w JOIN company_members cm ON w.company_id = cm.company_id WHERE w.id = workflows.website_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin', 'editor')) OR
  EXISTS (SELECT 1 FROM websites w JOIN companies c ON w.company_id = c.id WHERE w.id = workflows.website_id AND c.owner_id = auth.uid())
);

CREATE POLICY "Users can view prompts" ON ai_prompts FOR SELECT TO authenticated USING (
  website_id IS NULL OR EXISTS (SELECT 1 FROM websites w JOIN company_members cm ON w.company_id = cm.company_id WHERE w.id = ai_prompts.website_id AND cm.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM websites w JOIN companies c ON w.company_id = c.id WHERE w.id = ai_prompts.website_id AND c.owner_id = auth.uid())
);

CREATE POLICY "Editors can manage prompts" ON ai_prompts FOR ALL TO authenticated USING (
  website_id IS NULL OR EXISTS (SELECT 1 FROM websites w JOIN company_members cm ON w.company_id = cm.company_id WHERE w.id = ai_prompts.website_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin', 'editor')) OR
  EXISTS (SELECT 1 FROM websites w JOIN companies c ON w.company_id = c.id WHERE w.id = ai_prompts.website_id AND c.owner_id = auth.uid())
) WITH CHECK (
  website_id IS NULL OR EXISTS (SELECT 1 FROM websites w JOIN company_members cm ON w.company_id = cm.company_id WHERE w.id = ai_prompts.website_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin', 'editor')) OR
  EXISTS (SELECT 1 FROM websites w JOIN companies c ON w.company_id = c.id WHERE w.id = ai_prompts.website_id AND c.owner_id = auth.uid())
);

CREATE POLICY "Users can view execution logs" ON execution_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage execution logs" ON execution_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can manage own profile" ON profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Everyone can view roles" ON roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view user roles" ON user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM companies WHERE companies.id = user_roles.company_id AND companies.owner_id = auth.uid()));
CREATE POLICY "Admins can manage user roles" ON user_roles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = user_roles.company_id AND companies.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = user_roles.company_id AND companies.owner_id = auth.uid()));

CREATE POLICY "Users can view activity logs" ON user_activity_logs FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM companies WHERE companies.id = user_activity_logs.company_id AND companies.owner_id = auth.uid()));
CREATE POLICY "System can insert activity logs" ON user_activity_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view invitations" ON user_invitations FOR SELECT TO authenticated USING (invited_by = auth.uid() OR EXISTS (SELECT 1 FROM companies WHERE companies.id = user_invitations.company_id AND companies.owner_id = auth.uid()));
CREATE POLICY "Admins can send invitations" ON user_invitations FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = user_invitations.company_id AND companies.owner_id = auth.uid()));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON websites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credentials_updated_at BEFORE UPDATE ON credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_prompts_updated_at BEFORE UPDATE ON ai_prompts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();