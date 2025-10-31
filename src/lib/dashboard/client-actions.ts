import { createClient } from '@/lib/supabaseClient';
import { toast } from 'sonner';

/**
 * Client-side function to get dashboard statistics
 * This function should be called from client components
 */
export async function getDashboardStats(timeRange: string = '7d'): Promise<any> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in getDashboardStats:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    // Calculate date range based on timeRange
    const now = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Fetch articles data
    const { count: totalArticles, error: articlesError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (articlesError) {
      console.error('Error fetching total articles:', articlesError);
      throw articlesError;
    }

    // Fetch website data
    const { count: totalWebsites, error: websitesError } = await supabase
      .from('websites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (websitesError) {
      console.error('Error fetching total websites:', websitesError);
      throw websitesError;
    }

    // Fetch published articles data
    const { count: successfulArticles, error: publishedError } = await supabase
      .from('published_articles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (publishedError) {
      console.error('Error fetching published articles:', publishedError);
      throw publishedError;
    }

    // Calculate success rate
    const successRate = totalArticles > 0 ? Math.round(((successfulArticles || 0) / totalArticles) * 100) : 0;

    // Fetch article trend data
    const { data: articleTrend, error: trendError } = await supabase
      .from('articles')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (trendError) {
      console.error('Error fetching article trend:', trendError);
      throw trendError;
    }

    // Group articles by date
    const trendMap = new Map();
    articleTrend?.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      trendMap.set(date, (trendMap.get(date) || 0) + 1);
    });

    const articleTrendData = Array.from(trendMap, ([date, count]) => ({ date, count }));

    // Fetch articles by website data
    const { data: articlesByWebsiteData, error: byWebsiteError } = await supabase
      .from('articles')
      .select(`
        websites!inner(name)
      `)
      .eq('user_id', user.id);

    if (byWebsiteError) {
      console.error('Error fetching articles by website:', byWebsiteError);
      throw byWebsiteError;
    }

    // Group articles by website
    const websiteMap = new Map();
    articlesByWebsiteData?.forEach(item => {
      const websiteName = item.websites?.name || 'Unknown';
      websiteMap.set(websiteName, (websiteMap.get(websiteName) || 0) + 1);
    });

    const articlesByWebsite = Array.from(websiteMap, ([name, count]) => ({ name, count }));

    // Fetch articles by status
    const { data: articlesByStatusData, error: byStatusError } = await supabase
      .from('articles')
      .select('status')
      .eq('user_id', user.id);

    if (byStatusError) {
      console.error('Error fetching articles by status:', byStatusError);
      throw byStatusError;
    }

    // Group articles by status
    const statusMap = new Map();
    articlesByStatusData?.forEach(item => {
      const status = item.status || 'unknown';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const articlesByStatus = Array.from(statusMap, ([status, count]) => ({ status, count }));

    // Calculate articles change percentage (comparing last 7 days vs previous 7 days)
    const lastWeekStart = new Date();
    lastWeekStart.setDate(now.getDate() - 14);
    const lastWeekEnd = new Date();
    lastWeekEnd.setDate(now.getDate() - 7);
    
    const { count: prevArticles } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', lastWeekStart.toISOString())
      .lt('created_at', lastWeekEnd.toISOString());

    const { count: currentArticles } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', lastWeekEnd.toISOString());

    let articlesChange = 0;
    if (prevArticles && prevArticles > 0) {
      articlesChange = Math.round(((currentArticles! - prevArticles) / prevArticles) * 100);
    } else if (currentArticles && currentArticles > 0 && !prevArticles) {
      articlesChange = 100; // If previous was 0 and current is > 0, it's 100% increase
    }

    // Count healthy websites
    const { count: healthyWebsites } = await supabase
      .from('websites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('connection_status', null); // Assuming null means healthy, or you might have a different field

    return {
      total_articles: totalArticles || 0,
      total_websites: totalWebsites || 0,
      successful_articles: successfulArticles || 0,
      success_rate: successRate,
      articles_change: articlesChange,
      healthy_websites: healthyWebsites || 0,
      article_trend: articleTrendData,
      articles_by_website: articlesByWebsite,
      articles_by_status: articlesByStatus
    };
  } catch (err) {
    console.error('Unexpected error fetching dashboard stats (client):', err);
    toast.error('Failed to load dashboard statistics');
    throw err;
  }
}

/**
 * Client-side function to get recent activity
 * This function should be called from client components
 */
export async function getRecentActivity(limit: number = 10): Promise<any[]> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in getRecentActivity:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    return [];
  }

  try {
    // For this example, I'll use the articles table to show recent activity
    // In a real implementation, you might have a user_activity_logs table
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error in getRecentActivity:', error);
      toast.error('Failed to load recent activity');
      return [];
    }
    
    // Map to activity format
    return (data || []).map(item => ({
      id: item.id,
      action: `${item.status}_article`,
      created_at: item.created_at,
      metadata: { title: item.title }
    }));
  } catch (err) {
    console.error('Unexpected error fetching recent activity (client):', err);
    toast.error('Failed to load recent activity');
    return [];
  }
}