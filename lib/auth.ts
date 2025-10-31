// lib/actions/auth.ts
"use server"

import { createClient } from '@/lib/supabaseServices'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { randomUUID } from 'crypto'

export async function signUp(formData: {
    email: string
    password: string
    fullName: string
    invitationToken?: string
}) {
    const supabase = await createClient()

    // Log the signup attempt for debugging
    console.log("Attempting user signup with email:", formData.email);

    try {
        // Attempt to sign up the user with minimal metadata to prevent database conflicts
        const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                // Store only standard user metadata in auth
                data: {
                    full_name: formData.fullName,
                },
                emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
            },
        })

        if (error) {
            console.error("Supabase signUp error details:", {
                message: error.message,
                code: error.code,
                status: error.status,
                name: error.name
            });
            
            // More specific error handling
            if (error.message?.includes('User already registered')) {
                throw new Error('This email is already registered. Please try logging in instead.')
            }
            
            // Check if it's a database error specifically
            if (error.status === 500) {
                console.error("Database error during registration:", error);
                throw new Error('There was a problem with registration. The database might need to be properly configured.');
            }
            
            // Re-throw the original error to see more details
            throw error
        }

        // Log successful signup
        console.log("User signup successful:", data.user?.id);

        // If invitation token exists, it might need to be handled separately
        // This could be done after the user confirms their email
        if (formData.invitationToken) {
            console.log("Invitation token will be handled after email confirmation:", formData.invitationToken);
        }

        return data
    } catch (error: any) {
        console.error('Complete sign up error details:', {
            message: error.message,
            code: error.code,
            status: error.status,
            name: error.name,
            stack: error.stack
        });
        
        // Check for specific error conditions
        if (error.message?.includes('User already registered')) {
            throw new Error('This email is already registered. Please try logging in instead.')
        }
        
        // For 500 errors, which are server-side, provide more appropriate messaging
        if (error.status === 500) {
            console.error('Registration failed due to server-side issue:', error);
            // Instead of generic message, provide more actionable feedback
            throw new Error('Registration failed due to server configuration. Please contact support or ensure database migrations are applied.')
        }
        
        // If it's specifically a database error, provide more information
        if (error.message?.includes('Database error') || error.code === 'unexpected_failure') {
            console.error('Database error during registration:', error);
            throw new Error('Database error during registration. This might be due to incomplete database setup.')
        }
        
        // For other errors, provide the original error message
        throw new Error(error.message || 'Registration failed. Please try again.')
    }
}

export async function signIn(formData: {
    email: string
    password: string
}) {
    const supabase = await createClient()

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
    })

    if (error) {
        // Check if the error is specifically about email not being confirmed
        if (error.message.includes('email not confirmed') || error.message.includes('Email not confirmed')) {
            throw new Error('Email not confirmed. Please check your inbox for a confirmation email.')
        }
        throw error
    }

    // Check if email is confirmed
    if (data.user && !data.user.email_confirmed_at) {
        throw new Error('Email not confirmed. Please check your inbox for a confirmation email.')
    }

    // Log activity
    if (data.user) {
        await logActivity({
            userId: data.user.id,
            action: 'user_login',
            metadata: { method: 'password' }
        })
    }

    // Revalidate the path to update any server-side cached data
    revalidatePath('/', 'layout')
    
    try {
        // Redirect to dashboard after successful login
        redirect("/dashboard");
    } catch (e: any) {
        // Handle the Next.js redirect error
        if (e.message.includes("NEXT_REDIRECT")) return;
        throw e;
    }
}

export async function signOut() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        await logActivity({
            userId: user.id,
            action: 'user_logout',
        })
    }

    await supabase.auth.signOut()

    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function resetPassword(email: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    })

    if (error) {
        throw error
    }

    return { success: true }
}

export async function updatePassword(newPassword: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    })

    if (error) {
        throw error
    }

    return { success: true }
}

export async function resendConfirmationEmail(email: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
    })

    if (error) {
        throw error
    }

    return { success: true }
}

export async function getUser() {
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    return user
}

export async function getUserProfile() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    return { user }
}

export async function updateProfile(formData: {
    fullName?: string
    bio?: string
    phone?: string
    avatarUrl?: string
    timezone?: string
    language?: string
    theme?: string
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    // Prepare updates for user metadata
    const updates: any = {};

    if (formData.fullName !== undefined) updates.full_name = formData.fullName;
    if (formData.bio !== undefined) updates.bio = formData.bio;
    if (formData.phone !== undefined) updates.phone = formData.phone;
    if (formData.avatarUrl !== undefined) updates.avatar_url = formData.avatarUrl;
    if (formData.timezone !== undefined) updates.timezone = formData.timezone;
    if (formData.language !== undefined) updates.language = formData.language;
    if (formData.theme !== undefined) updates.theme = formData.theme;

    const { error } = await supabase.auth.updateUser({
        data: updates
    });

    if (error) {
        throw error
    }

    await logActivity({
        userId: user.id,
        action: 'profile_updated',
    })

    revalidatePath('/settings/profile')
    return { success: true }
}

export async function inviteUser(formData: {
    email: string
    companyId: string
    roleId: string
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    // Generate token
    const token = randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    const { data, error } = await supabase
        .from('user_invitations')
        .insert({
            email: formData.email,
            company_id: formData.companyId,
            role_id: formData.roleId,
            invited_by: user.id,
            token,
            expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

    if (error) {
        throw error
    }

    // Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/accept-invite?token=${token}`

    // TODO: Send email with inviteUrl
    // You can use Supabase Edge Functions or a service like Resend

    await logActivity({
        userId: user.id,
        action: 'user_invited',
        entityType: 'invitation',
        entityId: data.id,
        companyId: formData.companyId,
        metadata: { email: formData.email }
    })

    return data
}

async function logActivity(params: {
    userId: string
    action: string
    entityType?: string
    entityId?: string
    companyId?: string
    metadata?: Record<string, any>
}) {
    const supabase = await createClient()

    await supabase.from('user_activity_logs').insert({
        user_id: params.userId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        company_id: params.companyId,
        metadata: params.metadata || {},
    })
}