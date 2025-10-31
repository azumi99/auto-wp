export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  website_id: string;
  prompt_template_id?: string;
  webhook_url?: string;
  webhook_id?: string;
  is_active: boolean;
  schedule_type?: 'manual' | 'cron' | 'interval' | null;
  schedule_config?: any;
  created_at: string;
  updated_at: string;
}