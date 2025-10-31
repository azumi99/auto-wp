import { createClient } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { logger } from '../../../lib/logger';
import { Article } from './types';

/**
 * Client-side function to create an article with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function createArticleClient(article: Partial<Article>) {
  console.log('createArticleClient called with data:', article);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in createArticleClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    const articleData = {
      ...article,
      user_id: user.id,
      status: article.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('articles')
      .insert(articleData)
      .select('id, website_id, user_id, title, scheduled_at, status, webhook_id, created_at, updated_at, generation_type, generation_progress, generation_message, error_message, word_count, wp_post_url, failed_at, wp_post_id, generation_time_seconds, published_at')
      .single();

    if (error) {
      console.error('Database error in createArticleClient:', error);
      toast.error(`Failed to create article: ${error.message}`);
      throw error;
    }

    console.log('createArticleClient: database insert successful, id:', data.id);

    await logger.info('Article created (client)', {
      context: 'articles',
      article_id: data.id,
      user_id: user.id,
      article_title: article.title
    });

    toast.success('Article created successfully!');
    return data;
  } catch (err) {
    console.error('Unexpected error creating article (client):', err);
    toast.error('Unexpected error creating article.');
    throw err; // Re-throw so calling function can handle the error state
  }
}

/**
 * Client-side function to update an article with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function updateArticleClient(id: string, updates: Partial<Article>) {
  console.log('updateArticleClient called with id:', id, 'and updates:', updates);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in updateArticleClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, website_id, user_id, title, scheduled_at, status, webhook_id, created_at, updated_at, generation_type, generation_progress, generation_message, error_message, word_count, wp_post_url, failed_at, wp_post_id, generation_time_seconds, published_at')
      .single();

    if (error) {
      console.error('Database error in updateArticleClient:', error);
      toast.error(`Failed to update article: ${error.message}`);
      throw error;
    }

    console.log('updateArticleClient: database update successful, id:', data.id);

    await logger.info('Article updated (client)', {
      context: 'articles',
      article_id: id,
      user_id: user.id,
      article_title: updates.title
    });

    toast.success('Article updated successfully!');
    return data;
  } catch (err) {
    console.error('Unexpected error updating article (client):', err);
    toast.error('Unexpected error updating article.');
    throw err; // Re-throw so calling function can handle the error state
  }
}

/**
 * Client-side function to delete an article with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function deleteArticleClient(id: string) {
  console.log('deleteArticleClient called with id:', id);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in deleteArticleClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    // Get article data before deletion for logging and UI feedback
    const { data: articleData, error: selectError } = await supabase
      .from('articles')
      .select('title')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (selectError) {
      console.error('Error fetching article before deletion:', selectError);
      toast.error('Error preparing to delete article');
      throw selectError;
    }

    console.log('deleteArticleClient: found article to delete:', articleData);

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error in deleteArticleClient:', error);
      toast.error(`Failed to delete article: ${error.message}`);
      throw error;
    }

    console.log('deleteArticleClient: database delete successful');

    await logger.info('Article deleted (client)', {
      context: 'articles',
      article_id: id,
      user_id: user.id,
      article_title: articleData?.title
    });

    toast.success('Article deleted successfully!');
    return { success: true, id };
  } catch (err) {
    console.error('Unexpected error deleting article (client):', err);
    toast.error('Unexpected error deleting article.');
    throw err; // Re-throw so calling function can handle the error state
  }
}

/**
 * Client-side function to trigger article generation with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function generateArticleClient(articleData: {
  website_id: string;
  webhook_id: string;
  topic: string;
  scheduled_datetime: string | null;
  generation_type: 'manual' | 'scheduled';
}) {
  console.log('generateArticleClient called with data:', articleData);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in generateArticleClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    // Determine status based on generation type
    const status = articleData.generation_type === 'scheduled' ? 'pending' : 'draft';

    // Prepare the article data
    const articleInsert = {
      user_id: user.id,
      website_id: articleData.website_id,
      webhook_id: articleData.webhook_id,
      title: articleData.topic,
      status,
      scheduled_at: articleData.scheduled_datetime,
      generation_type: articleData.generation_type, // Add this line
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('articles')
      .insert(articleInsert)
      .select('id, website_id, user_id, title, scheduled_at, status, webhook_id, created_at, updated_at, generation_type, generation_progress, generation_message, error_message, word_count, wp_post_url, failed_at, wp_post_id, generation_time_seconds, published_at')
      .single()

    if (error) {
      console.error('Error creating article:', error);
      const errorMessage = (error as any)?.message || (error as any)?.error || (error as any)?.details || 'Failed to create article';
      toast.error(`Failed to create article: ${errorMessage}`);
      throw error;
    }

    console.log('generateArticleClient: database insert successful, id:', data.id);

    // If it's a manual generation, we could trigger an AI service here
    // For now, we'll just create the article with empty content
    // In a real implementation, you would call an AI service to generate the content

    await logger.info('Article generated (client)', {
      context: 'articles',
      article_id: data.id,
      user_id: user.id,
      article_title: articleData.topic,
      generation_type: articleData.generation_type
    });

    toast.success('Article generated successfully!');
    return data;
  } catch (err) {
    console.error('Unexpected error generating article (client):', err);
    const errorMessage = (err as any)?.message || (err as any)?.error || (err as any)?.details || 'Unexpected error generating article';
    toast.error(errorMessage);
    throw err; // Re-throw so calling function can handle the error state
  }
}

/**
 * Client-side function to get articles with proper filtering and pagination
 * This function should be called from client components
 */
export async function getArticlesClient(
  page: number = 1,
  limit: number = 10,
  status?: string,
  generationType?: string,
  search?: string
): Promise<{ articles: any[]; page: number; limit: number; total: number; totalPages: number }> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('getArticlesClient: Starting with user:', user?.id);

  if (!user || authError) {
    console.error('Authentication error in getArticlesClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    return { articles: [], page, limit, total: 0, totalPages: 0 };
  }

  const authUser = user;
  console.log('getArticlesClient: Authenticated user:', authUser.id);

  try {
    try {
      console.log('getArticlesClient: Building query with parameters:', {
        page,
        limit,
        status,
        generationType,
        search,
        userId: authUser.id
      });

      // Build the query with filters and joins
      let query = supabase
        .from('articles')
        .select(`
          id, 
          website_id,
          user_id, 
          title, 
          scheduled_at,
          status, 
          created_at,
          updated_at,
          generation_type,
          generation_progress,
          generation_message,
          error_message,
          word_count,
          wp_post_url,
          failed_at,
          wp_post_id,
          generation_time_seconds,
          published_at,
          websites (id, name, url),
          webhooks (id, name)
        `, { count: 'exact' })
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      
      if (generationType && generationType !== 'all') {
        query = query.eq('generation_type', generationType);
      }
      
      if (search) {
        // Safer search implementation to avoid query construction errors
        const searchTerm = search.trim();
        if (searchTerm) {
          try {
            query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
          } catch (searchError) {
            console.warn('Warning: Complex search query failed, falling back to simple search:', searchError);
            query = query.ilike('title', `%${searchTerm}%`);
          }
        }
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      console.log('getArticlesClient: About to execute query with params:', {
        userId: authUser.id,
        page,
        limit
      });
      const { data, error, count } = await query;
      console.log('getArticlesClient: Query result - data length:', data?.length, 'error:', error, 'count:', count);

      if (error) {
        console.error('Primary query failed in getArticlesClient:', error);
        console.error('Query details:', {
          status,
          generationType,
          search,
          page,
          limit,
          userId: authUser.id
        });

        // Try a simpler fallback query without joins
        console.log('Attempting fallback query without joins...');
        try {
          const fallbackQuery = supabase
            .from('articles')
            .select(`
              id, 
              user_id, 
              title, 
              status, 
              created_at
            `, { count: 'exact' })
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false });

          if (status && status !== 'all') {
            fallbackQuery.eq('status', status);
          }
          
          if (generationType && generationType !== 'all') {
            fallbackQuery.eq('generation_type', generationType);
          }
          
          if (search) {
            const searchTerm = search.trim();
            if (searchTerm) {
              fallbackQuery.ilike('title', `%${searchTerm}%`);
            }
          }

          const offset = (page - 1) * limit;
          const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery.range(offset, offset + limit - 1);

          if (fallbackError) {
            console.error('Fallback query also failed:', fallbackError);
            toast.error(`Failed to load articles: ${fallbackError.message || 'Database error'}`);
            return { articles: [], page, limit, total: 0, totalPages: 0 };
          }

          const fallbackTotal = fallbackCount || 0;
          const fallbackTotalPages = Math.ceil(fallbackTotal / limit);

          console.log('Fallback query successful, returning simplified data');
          toast.success('Articles loaded with limited information');
          return {
            articles: fallbackData || [],
            page,
            limit,
            total: fallbackTotal,
            totalPages: fallbackTotalPages
          };
        } catch (fallbackError) {
          console.error('Error in fallback mechanism:', fallbackError);
          toast.error('Failed to load articles');
          return { articles: [], page, limit, total: 0, totalPages: 0 };
        }
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        articles: data || [],
        page,
        limit,
        total,
        totalPages
      };
    } catch (queryError) {
      console.error('Unexpected error building query in getArticlesClient:', queryError);
      console.error('Query parameters:', {
        status,
        generationType,
        search,
        page,
        limit,
        userId: authUser.id
      });
      toast.error('Failed to load articles due to query error');
      return { articles: [], page, limit, total: 0, totalPages: 0 };
    }
  } catch (err) {
    console.error('Unexpected error fetching articles (client):', err);
    toast.error('Failed to load articles');
    return { articles: [], page, limit, total: 0, totalPages: 0 };
  }
}

/**
 * Client-side function to get a specific article by ID
 * This function should be called from client components
 */
export async function getArticleByIdClient(id: string): Promise<any | null> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in getArticleByIdClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        id, 
        website_id, 
        user_id, 
        title, 
        content, 
        status, 
        scheduled_at, 
        created_at, 
        updated_at,
        generation_type,
        generation_progress,
        generation_message,
        error_message,
        word_count,
        wp_post_url,
  
        metadata,
        websites!inner(id, name, url),
        webhooks!inner(id, name)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Database error in getArticleByIdClient:', error);
      toast.error('Failed to load article');
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error fetching article by ID (client):', err);
    toast.error('Failed to load article');
    return null;
  }
}