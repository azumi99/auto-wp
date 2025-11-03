import { createClient } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { logger } from '../../../lib/logger';
import { AIPrompt } from './types';

/**
 * Client-side function to create an AI prompt with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function createAIPromptClient(aiPromptData: Partial<AIPrompt>) {
  console.log('createAIPromptClient called with data:', aiPromptData);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in createAIPromptClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    const promptInsert = {
      ...aiPromptData,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('ai_prompts')
      .insert(promptInsert)
      .select('id, user_id, name, template, created_at, updated_at')
      .single();

    if (error) {
      console.error('Database error in createAIPromptClient:', error);
      toast.error(`Failed to create AI prompt: ${error.message}`);
      throw error;
    }

    console.log('createAIPromptClient: database insert successful, id:', data.id);

    await logger.info('AI prompt created (client)', {
      context: 'ai_prompts',
      prompt_id: data.id,
      user_id: user.id,
      prompt_name: aiPromptData.name
    });

    toast.success('AI prompt created successfully!');
    return data;
  } catch (err) {
    console.error('Unexpected error creating AI prompt (client):', err);
    toast.error('Unexpected error creating AI prompt.');
    throw err; // Re-throw so calling function can handle the error state
  }
}

/**
 * Client-side function to update an AI prompt with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function updateAIPromptClient(id: string, updates: Partial<AIPrompt>) {
  console.log('updateAIPromptClient called with id:', id, 'and updates:', updates);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in updateAIPromptClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    throw new Error('Not authenticated');
  }

  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('ai_prompts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, user_id, name, template, created_at, updated_at')
      .single();

    if (error) {
      console.error('Database error in updateAIPromptClient:', error);
      toast.error(`Failed to update AI prompt: ${error.message}`);
      throw error;
    }

    console.log('updateAIPromptClient: database update successful, id:', data.id);

    await logger.info('AI prompt updated (client)', {
      context: 'ai_prompts',
      prompt_id: id,
      user_id: user.id,
      prompt_name: updates.name
    });

    toast.success('AI prompt updated successfully!');
    return data;
  } catch (err) {
    console.error('Unexpected error updating AI prompt (client):', err);
    toast.error('Unexpected error updating AI prompt.');
    throw err; // Re-throw so calling function can handle the error state
  }
}

/**
 * Client-side function to delete an AI prompt with proper realtime updates
 * This function should be called from client components to ensure
 * Supabase Realtime updates work properly
 */
export async function deleteAIPromptClient(id: string) {
  console.log('deleteAIPromptClient called with id:', id);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in deleteAIPromptClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    return {
      success: false,
      error: 'Not authenticated',
      requiresAction: false
    };
  }

  try {
    // Get prompt data before deletion for logging and UI feedback
    const { data: promptData, error: selectError } = await supabase
      .from('ai_prompts')
      .select('name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (selectError) {
      console.error('Error fetching AI prompt before deletion:', selectError);
      toast.error('Error preparing to delete AI prompt');
      return {
        success: false,
        error: 'Error preparing to delete AI prompt',
        requiresAction: false
      };
    }

    console.log('deleteAIPromptClient: found prompt to delete:', promptData);

    // Check for workflows using this AI prompt before deletion
    const { data: workflowData, error: workflowError } = await supabase
      .from('workflows')
      .select('id, name')
      .eq('prompt_template_id', id)
      .eq('user_id', user.id);

    if (workflowError) {
      console.error('Error checking workflows using this AI prompt:', workflowError);
      toast.error('Error checking AI prompt dependencies');
      return {
        success: false,
        error: 'Error checking AI prompt dependencies',
        requiresAction: false
      };
    }

    // Check for workflows using this AI prompt and block deletion if found
    if (workflowData && workflowData.length > 0) {
      const dependencies = [];
      if (workflowData.length > 0) {
        dependencies.push(`${workflowData.length} workflow${workflowData.length > 1 ? '' : ''}`);
      }

      const errorMessage = `AI prompt tidak bisa dihapus karena masih memiliki: ${dependencies.join(', ')}. Hapus data terkait terlebih dahulu.`;
      toast.warning(errorMessage);
      return {
        success: false,
        error: errorMessage,
        requiresAction: true,
        dependencies: dependencies,
        affectedWorkflows: workflowData.map(workflow => ({
          id: workflow.id,
          name: workflow.name
        }))
      };
    }

    const { error } = await supabase
      .from('ai_prompts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error(`Gagal menghapus AI prompt: ${error.message}`);
      return {
        success: false,
        error: error.message,
        requiresAction: false
      };
    }

    console.log('deleteAIPromptClient: database delete successful');

    await logger.info('AI prompt deleted (client)', {
      context: 'ai_prompts',
      prompt_id: id,
      user_id: user.id,
      prompt_name: promptData?.name
    });

    toast.success('✅ AI prompt berhasil dihapus!');
    return { success: true, id };
  } catch (err) {
    console.error('Unexpected error deleting AI prompt (client):', err);
    toast.error('Terjadi kesalahan yang tidak diharapkan saat menghapus AI prompt.');
    return {
      success: false,
      error: 'Unexpected error occurred while deleting AI prompt',
      requiresAction: false
    };
  }
}

/**
 * Force delete an AI prompt without confirmation
 * This function should be called after user confirms deletion
 */
export async function deleteAIPromptClientForce(id: string) {
  console.log('deleteAIPromptClientForce called with id:', id);

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in deleteAIPromptClientForce:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    return {
      success: false,
      error: 'Not authenticated',
      requiresAction: false
    };
  }

  try {
    // Get prompt data before deletion for logging
    const { data: promptData, error: selectError } = await supabase
      .from('ai_prompts')
      .select('name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (selectError) {
      console.error('Error fetching AI prompt before deletion:', selectError);
      toast.error('Error preparing to delete AI prompt');
      return {
        success: false,
        error: 'Error preparing to delete AI prompt',
        requiresAction: false
      };
    }

    const { error } = await supabase
      .from('ai_prompts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error in deleteAIPromptClientForce:', error);
      toast.error(`Gagal menghapus AI prompt: ${error.message}`);
      return {
        success: false,
        error: error.message,
        requiresAction: false
      };
    }

    await logger.info('AI prompt force deleted (client)', {
      context: 'ai_prompts',
      prompt_id: id,
      user_id: user.id,
      prompt_name: promptData?.name,
      force_delete: true
    });

    toast.success('✅ AI prompt berhasil dihapus!');
    return { success: true, id };
  } catch (err) {
    console.error('Unexpected error force deleting AI prompt (client):', err);
    toast.error('Terjadi kesalahan yang tidak diharapkan saat menghapus AI prompt.');
    return {
      success: false,
      error: 'Unexpected error occurred while deleting AI prompt',
      requiresAction: false
    };
  }
}

/**
 * Client-side function to get all AI prompts for the current user
 * This function should be called from client components
 */
export async function getAIPromptsClient(): Promise<AIPrompt[]> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in getAIPromptsClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    return []; // Return empty array if user is not authenticated
  }

  try {
    const { data, error } = await supabase
      .from('ai_prompts')
      .select('id, user_id, name, template, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error in getAIPromptsClient:', error);
      toast.error('Failed to load AI prompts');
      return []; // Return empty array on error
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching AI prompts (client):', err);
    toast.error('Failed to load AI prompts');
    return []; // Return empty array on error
  }
}

/**
 * Client-side function to get a specific AI prompt by ID
 * This function should be called from client components
 */
export async function getAIPromptByIdClient(id: string): Promise<AIPrompt | null> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication error in getAIPromptByIdClient:', authError);
    toast.error('Authentication error. Please try logging out and in again.');
    return null; // Return null if user is not authenticated
  }

  try {
    const { data, error } = await supabase
      .from('ai_prompts')
      .select('id, user_id, name, template, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Database error in getAIPromptByIdClient:', error);
      toast.error('Failed to load AI prompt');
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error fetching AI prompt by ID (client):', err);
    toast.error('Failed to load AI prompt');
    return null;
  }
}