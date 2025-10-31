export type WebsiteStatus = 'active' | 'inactive' | 'maintenance';
export type HealthStatus = 'healthy' | 'warning' | 'error' | 'unknown';

export interface Website {
  id: string;
  user_id: string;
  name: string;
  url: string;
  wp_username: string;
  wp_password?: string;  // This should be handled with encryption in the db
  wp_token: string | null;
  status?: 'active' | 'inactive' | 'maintenance'; // For the UI only, not stored in the database
  created_at: string;
  updated_at: string;
}