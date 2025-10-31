import { createClient } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { logger } from '../../../lib/logger';
import { PublishedArticle } from './types';

/**
 * Client-side function to create a published article with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function createPublishedArticleClient(publishedArticleData: Omit<PublishedArticle, 'id' | 'created_at' | 'updated_at'>) {
  console.log('createPublishedArticleClient called with data:', publishedArticleData);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in createPublishedArticleClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    const articleInsert = {
      ...publishedArticleData,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('published_articles')
      .insert(articleInsert)
      .select('id, article_id, website_id, user_id, title, excerpt, image_url, post_url, published_at, created_at, updated_at')
      .single();

    if (error) {
      console.error('Database error in createPublishedArticleClient:', error);
      toast.error(`Failed to create published article: ${error.message}`);
      throw error;
    }

    console.log('createPublishedArticleClient: database insert successful, id:', data.id);

    await logger.info('Published article created (client)', {
      context: 'published_articles',
      article_id: data.id,
      user_id: user.id,
      article_title: publishedArticleData.title
    });

    toast.success('Published article created successfully!');
    return data;
  } catch (err) {
    console.error('Unexpected error creating published article (client):', err);
    toast.error('Unexpected error creating published article.');
    throw err; // Re-throw so calling function can handle the error state
  }
}

/**
 * Client-side function to update a published article with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function updatePublishedArticleClient(id: string, updates: Partial<PublishedArticle>) {
  console.log('updatePublishedArticleClient called with id:', id, 'and updates:', updates);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in updatePublishedArticleClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('published_articles')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, article_id, website_id, user_id, title, excerpt, image_url, post_url, published_at, created_at, updated_at')
      .single();

    if (error) {
      console.error('Database error in updatePublishedArticleClient:', error);
      toast.error(`Failed to update published article: ${error.message}`);
      throw error;
    }

    console.log('updatePublishedArticleClient: database update successful, id:', data.id);

    await logger.info('Published article updated (client)', {
      context: 'published_articles',
      article_id: id,
      user_id: user.id,
      article_title: updates.title
    });

    toast.success('Published article updated successfully!');
    return data;
  } catch (err) {
    console.error('Unexpected error updating published article (client):', err);
    toast.error('Unexpected error updating published article.');
    throw err; // Re-throw so calling function can handle the error state
  }
}

/**
 * Client-side function to delete a published article with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function deletePublishedArticleClient(id: string) {
  console.log('deletePublishedArticleClient called with id:', id);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in deletePublishedArticleClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    // Get article data before deletion for logging and UI feedback
    const { data: articleData, error: selectError } = await supabase
      .from('published_articles')
      .select('title')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (selectError) {
      console.error('Error fetching published article before deletion:', selectError);
      toast.error('Error preparing to delete published article');
      throw selectError;
    }

    console.log('deletePublishedArticleClient: found article to delete:', articleData);

    const { error } = await supabase
      .from('published_articles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error in deletePublishedArticleClient:', error);
      toast.error(`Failed to delete published article: ${error.message}`);
      throw error;
    }

    console.log('deletePublishedArticleClient: database delete successful');

    await logger.info('Published article deleted (client)', {
      context: 'published_articles',
      article_id: id,
      user_id: user.id,
      article_title: articleData?.title
    });

    toast.success('Published article deleted successfully!');
    return { success: true, id };
  } catch (err) {
    console.error('Unexpected error deleting published article (client):', err);
    toast.error('Unexpected error deleting published article.');
    throw err; // Re-throw so calling function can handle the error state
  }
}

/**
 * Client-side function to get all published articles for the current user
 * This function should be called from client components
 */
export async function getPublishedArticlesClient(): Promise<PublishedArticle[]> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in getPublishedArticlesClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    return []; // Return empty array if user is not authenticated
  }

  try {
    const { data, error } = await supabase
      .from('published_articles')
      .select('id, article_id, website_id, user_id, title, excerpt, image_url, post_url, published_at, created_at, updated_at')
      .eq('user_id', user.id)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Database error in getPublishedArticlesClient:', error);
      toast.error('Failed to load published articles');
      return []; // Return empty array on error
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching published articles (client):', err);
    toast.error('Failed to load published articles');
    return []; // Return empty array on error
  }
}

/**
 * Client-side function to get a specific published article by ID
 * This function should be called from client components
 */
export async function getPublishedArticleByIdClient(id: string): Promise<PublishedArticle | null> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in getPublishedArticleByIdClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    return null; // Return null if user is not authenticated
  }

  try {
    const { data, error } = await supabase
      .from('published_articles')
      .select('id, article_id, website_id, user_id, title, excerpt, image_url, post_url, published_at, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Database error in getPublishedArticleByIdClient:', error);
      toast.error('Failed to load published article');
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error fetching published article by ID (client):', err);
    toast.error('Failed to load published article');
    return null;
  }
}