import { createClient } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { logger } from '../../../lib/logger';
import { Website } from './types';

/**
 * Client-side function to create a website with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function createWebsiteClient(formData: Partial<Website>) {
  console.log('createWebsiteClient called with data:', formData);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in createWebsiteClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    // Add the user_id to the form data
    const websiteData = {
      ...formData,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('websites')
      .insert(websiteData)
      .select('id, user_id, name, url, wp_username, wp_password, wp_token, created_at, updated_at')
      .single();

    if (error) {
      console.error('Database error in createWebsiteClient:', error);
      toast.error(`Failed to create website: ${error.message}`);
      throw error;
    }

    console.log('createWebsiteClient: database insert successful, id:', data.id);

    await logger.info('Website created (client)', {
      context: 'websites',
      website_id: data.id,
      user_id: user.id,
      website_name: formData.name,
      website_url: formData.url
    });

    toast.success('✅ Website created successfully!');
    return data;
  } catch (err) {
    console.error('❌ Unexpected error creating website (client):', err);
    toast.error('Unexpected error creating website.');
    throw err; // Re-throw so calling function can handle the error state
  }
}

/**
 * Client-side function to update a website with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function updateWebsiteClient(id: string, formData: Partial<Website>) {
  console.log('updateWebsiteClient called with id:', id, 'and data:', formData);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in updateWebsiteClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    const updateData = {
      ...formData,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('websites')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, user_id, name, url, wp_username, wp_password, wp_token, created_at, updated_at')
      .single();

    if (error) {
      console.error('Database error in updateWebsiteClient:', error);
      toast.error(`Failed to update website: ${error.message}`);
      throw error;
    }

    console.log('updateWebsiteClient: database update successful, id:', data.id);

    await logger.info('Website updated (client)', {
      context: 'websites',
      website_id: id,
      user_id: user.id,
      website_name: formData.name
    });

    toast.success('✅ Website updated successfully!');
    return data;
  } catch (err) {
    console.error('❌ Unexpected error updating website (client):', err);
    toast.error('Unexpected error updating website.');
    throw err; // Re-throw so calling function can handle the error state
  }
}

/**
 * Client-side function to delete a website with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function deleteWebsiteClient(id: string) {
  console.log('deleteWebsiteClient called with id:', id);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in deleteWebsiteClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    // Get website data before deletion for logging and UI feedback
    const { data: websiteData, error: selectError } = await supabase
      .from('websites')
      .select('name, url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (selectError) {
      console.error('Error fetching website before deletion:', selectError);
      toast.error('Error preparing to delete website');
      throw selectError;
    }

    console.log('deleteWebsiteClient: found website to delete:', websiteData);

    const { error } = await supabase
      .from('websites')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error in deleteWebsiteClient:', error);
      toast.error(`Failed to delete website: ${error.message}`);
      throw error;
    }

    console.log('deleteWebsiteClient: database delete successful');

    await logger.info('Website deleted (client)', {
      context: 'websites',
      website_id: id,
      user_id: user.id,
      website_name: websiteData?.name,
      website_url: websiteData?.url
    });

    toast.success('✅ Website deleted successfully!');
    return { success: true, id };
  } catch (err) {
    console.error('❌ Unexpected error deleting website (client):', err);
    toast.error('Unexpected error deleting website.');
    throw err; // Re-throw so calling function can handle the error state
  }
}



/**
 * Client-side function to get all websites for the current user
 * This function should be called from client components
 */
export async function getWebsitesClient(): Promise<Website[]> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in getWebsitesClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    return []; // Return empty array if user is not authenticated
  }

  try {
    const { data, error } = await supabase
      .from('websites')
      .select('id, user_id, name, url, wp_username, wp_password, wp_token, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error in getWebsitesClient:', error);
      toast.error('Failed to load websites');
      return []; // Return empty array on error
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching websites (client):', err);
    toast.error('Failed to load websites');
    return []; // Return empty array on error
  }
}

/**
 * Client-side function to get a specific website by ID
 * This function should be called from client components
 */
export async function getWebsiteByIdClient(id: string): Promise<Website | null> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in getWebsiteByIdClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    return null; // Return null if user is not authenticated
  }

  try {
    const { data, error } = await supabase
      .from('websites')
      .select('id, user_id, name, url, wp_username, wp_password, wp_token, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Database error in getWebsiteByIdClient:', error);
      toast.error('Failed to load website');
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error fetching website by ID (client):', err);
    toast.error('Failed to load website');
    return null;
  }
}