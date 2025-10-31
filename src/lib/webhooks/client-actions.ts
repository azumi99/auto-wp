import { createClient } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { logger } from '../../../lib/logger';
import { Webhook } from './types';

/**
 * Client-side function to create a webhook with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function createWebhookClient(webhookData: {
  name: string
  url: string
  active?: boolean
}) {
  console.log('createWebhookClient called with data:', webhookData);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in createWebhookClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    const webhookInsert = {
      user_id: user.id,
      name: webhookData.name,
      url: webhookData.url,
      active: webhookData.active ?? true
    };

    const { data, error } = await supabase
      .from('webhooks')
      .insert(webhookInsert)
      .select('id, user_id, name, url, active, created_at')
      .single();

    if (error) {
      console.error('Database error in createWebhookClient:', error);
      toast.error(`Failed to create webhook: ${error.message}`);
      throw error;
    }

    console.log('createWebhookClient: database insert successful, id:', data.id);

    await logger.info('Webhook created (client)', {
      context: 'webhooks',
      webhook_id: data.id,
      user_id: user.id,
      webhook_name: webhookData.name
    });

    toast.success('Webhook created successfully!');
    return data;
  } catch (err) {
    console.error('Unexpected error creating webhook (client):', err);
    toast.error('Unexpected error creating webhook.');
    throw err; // Re-throw so calling function can handle the error state
  }
}

/**
 * Client-side function to update a webhook with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function updateWebhookClient(id: string, webhookData: {
  name?: string
  url?: string
  active?: boolean
}) {
  console.log('updateWebhookClient called with id:', id, 'and data:', webhookData);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in updateWebhookClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    const updateData = {
      ...webhookData,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('webhooks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, user_id, name, url, active, created_at')
      .single();

    if (error) {
      console.error('Database error in updateWebhookClient:', error);
      toast.error(`Failed to update webhook: ${error.message}`);
      throw error;
    }

    console.log('updateWebhookClient: database update successful, id:', data.id);

    await logger.info('Webhook updated (client)', {
      context: 'webhooks',
      webhook_id: id,
      user_id: user.id,
      webhook_name: webhookData.name
    });

    toast.success('Webhook updated successfully!');
    return data;
  } catch (err) {
    console.error('Unexpected error updating webhook (client):', err);
    toast.error('Unexpected error updating webhook.');
    throw err; // Re-throw so calling function can handle the error state
  }
}

/**
 * Client-side function to delete a webhook with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function deleteWebhookClient(id: string) {
  console.log('deleteWebhookClient called with id:', id);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in deleteWebhookClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    // Get webhook data before deletion for logging and UI feedback
    const { data: webhookData, error: selectError } = await supabase
      .from('webhooks')
      .select('name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (selectError) {
      console.error('Error fetching webhook before deletion:', selectError);
      toast.error('Error preparing to delete webhook');
      throw selectError;
    }

    console.log('deleteWebhookClient: found webhook to delete:', webhookData);

    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error in deleteWebhookClient:', error);
      toast.error(`Failed to delete webhook: ${error.message}`);
      throw error;
    }

    console.log('deleteWebhookClient: database delete successful');

    await logger.info('Webhook deleted (client)', {
      context: 'webhooks',
      webhook_id: id,
      user_id: user.id,
      webhook_name: webhookData?.name
    });

    toast.success('Webhook deleted successfully!');
    return { success: true, id };
  } catch (err) {
    console.error('Unexpected error deleting webhook (client):', err);
    toast.error('Unexpected error deleting webhook.');
    throw err; // Re-throw so calling function can handle the error state
  }
}

/**
 * Client-side function to get all webhooks for the current user
 * This function should be called from client components
 */
export async function getWebhooksClient(): Promise<Webhook[]> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in getWebhooksClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    return []; // Return empty array if user is not authenticated
  }

  try {
    const { data, error } = await supabase
      .from('webhooks')
      .select('id, user_id, name, url, active, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error in getWebhooksClient:', error);
      toast.error('Failed to load webhooks');
      return []; // Return empty array on error
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching webhooks (client):', err);
    toast.error('Failed to load webhooks');
    return []; // Return empty array on error
  }
}

/**
 * Client-side function to get a specific webhook by ID
 * This function should be called from client components
 */
export async function getWebhookByIdClient(id: string): Promise<Webhook | null> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in getWebhookByIdClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    return null; // Return null if user is not authenticated
  }

  try {
    const { data, error } = await supabase
      .from('webhooks')
      .select('id, user_id, name, url, active, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Database error in getWebhookByIdClient:', error);
      toast.error('Failed to load webhook');
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error fetching webhook by ID (client):', err);
    toast.error('Failed to load webhook');
    return null;
  }
}


