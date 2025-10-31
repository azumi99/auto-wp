import { createClient } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { logger } from '../../../lib/logger';
import { Workflow } from './types';

/**
 * Client-side function to create a workflow with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function createWorkflowClient(workflowData: Partial<Workflow>) {
  console.log('createWorkflowClient called with data:', workflowData);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in createWorkflowClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    const workflowInsert = {
      ...workflowData,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('workflows')
      .insert(workflowInsert)
      .select('id, user_id, name, description, is_active, created_at, updated_at')
      .single();

    if (error) {
      console.error('Database error in createWorkflowClient:', error);
      toast.error(`Failed to create workflow: ${error.message}`);
      throw error;
    }

    console.log('createWorkflowClient: database insert successful, id:', data.id);

    await logger.info('Workflow created (client)', {
      context: 'workflows',
      workflow_id: data.id,
      user_id: user.id,
      workflow_name: workflowData.name
    });

    toast.success('Workflow created successfully!');
    return data;
  } catch (err) {
    console.error('Unexpected error creating workflow (client):', err);
    toast.error('Unexpected error creating workflow.');
    throw err; // Re-throw so calling function can handle the error state
  }
}

/**
 * Client-side function to update a workflow with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function updateWorkflowClient(id: string, workflowData: Partial<Workflow>) {
  console.log('updateWorkflowClient called with id:', id, 'and data:', workflowData);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in updateWorkflowClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    const updateData = {
      ...workflowData,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('workflows')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, user_id, name, description, is_active, created_at, updated_at')
      .single();

    if (error) {
      console.error('Database error in updateWorkflowClient:', error);
      toast.error(`Failed to update workflow: ${error.message}`);
      throw error;
    }

    console.log('updateWorkflowClient: database update successful, id:', data.id);

    await logger.info('Workflow updated (client)', {
      context: 'workflows',
      workflow_id: id,
      user_id: user.id,
      workflow_name: workflowData.name
    });

    toast.success('Workflow updated successfully!');
    return data;
  } catch (err) {
    console.error('Unexpected error updating workflow (client):', err);
    toast.error('Unexpected error updating workflow.');
    throw err; // Re-throw so calling function can handle the error state
  }
}

/**
 * Client-side function to delete a workflow with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function deleteWorkflowClient(id: string) {
  console.log('deleteWorkflowClient called with id:', id);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in deleteWorkflowClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    // Get workflow data before deletion for logging and UI feedback
    const { data: workflowData, error: selectError } = await supabase
      .from('workflows')
      .select('name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (selectError) {
      console.error('Error fetching workflow before deletion:', selectError);
      toast.error('Error preparing to delete workflow');
      throw selectError;
    }

    console.log('deleteWorkflowClient: found workflow to delete:', workflowData);

    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error in deleteWorkflowClient:', error);
      toast.error(`Failed to delete workflow: ${error.message}`);
      throw error;
    }

    console.log('deleteWorkflowClient: database delete successful');

    await logger.info('Workflow deleted (client)', {
      context: 'workflows',
      workflow_id: id,
      user_id: user.id,
      workflow_name: workflowData?.name
    });

    toast.success('Workflow deleted successfully!');
    return { success: true, id };
  } catch (err) {
    console.error('Unexpected error deleting workflow (client):', err);
    toast.error('Unexpected error deleting workflow.');
    throw err; // Re-throw so calling function can handle the error state
  }
}

/**
 * Client-side function to get all workflows for the current user
 * This function should be called from client components
 */
export async function getWorkflowsClient(): Promise<Workflow[]> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in getWorkflowsClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    return []; // Return empty array if user is not authenticated
  }

  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('id, user_id, name, description, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error in getWorkflowsClient:', error);
      toast.error('Failed to load workflows');
      return []; // Return empty array on error
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching workflows (client):', err);
    toast.error('Failed to load workflows');
    return []; // Return empty array on error
  }
}

/**
 * Client-side function to get a specific workflow by ID
 * This function should be called from client components
 */
export async function getWorkflowByIdClient(id: string): Promise<Workflow | null> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in getWorkflowByIdClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    return null; // Return null if user is not authenticated
  }

  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('id, user_id, name, description, is_active, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Database error in getWorkflowByIdClient:', error);
      toast.error('Failed to load workflow');
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error fetching workflow by ID (client):', err);
    toast.error('Failed to load workflow');
    return null;
  }
}