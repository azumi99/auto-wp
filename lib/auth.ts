// lib/actions/auth.ts
"use server"

import { createClient } from '@/lib/supabaseServices'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signUp(formData: {
    email: string
    password: string
    fullName: string
    invitationToken?: string
}) {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
            data: {
                full_name: formData.fullName,
                invitation_token: formData.invitationToken,
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
    })

    if (error) {
        throw error
    }

    return data
}

export async function signIn(formData: {
    email: string
    password: string
}) {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
    })

    if (error) {
        throw error
    }

    // Log activity
    if (data.user) {
        await logActivity({
            userId: data.user.id,
            action: 'user_login',
            metadata: { method: 'password' }
        })
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signOut() {
    const supabase = createClient()

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
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    })

    if (error) {
        throw error
    }

    return { success: true }
}

export async function updatePassword(newPassword: string) {
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    })

    if (error) {
        throw error
    }

    return { success: true }
}

export async function getUser() {
    const supabase = createClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    return user
}

export async function getUserProfile() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return { user, profile }
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
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: formData.fullName,
            bio: formData.bio,
            phone: formData.phone,
            avatar_url: formData.avatarUrl,
            timezone: formData.timezone,
            language: formData.language,
            theme: formData.theme,
        })
        .eq('id', user.id)

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
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    // Generate token
    const token = crypto.randomUUID()
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
    const supabase = createClient()

    await supabase.from('user_activity_logs').insert({
        user_id: params.userId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        company_id: params.companyId,
        metadata: params.metadata || {},
    })
}