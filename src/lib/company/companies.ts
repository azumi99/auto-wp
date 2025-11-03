"use server"

import { supabase } from '@/lib/supabase'
import { Company, CompanyStatus } from '@/src/lib/company/interface'
import { revalidatePath } from 'next/cache'

export async function getCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      company_members(count)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getCompanyById(id: string) {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      company_members(
        id,
        role,
        user_id,
        created_at
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createCompany(formData: {
  name?: string
  slug?: string
  description?: string
  website_url?: string
  logo_url?: string
  owner_id: string
}) {
  const { data, error } = await supabase
    .from('companies')
    .insert([formData])
    .select()
    .single()

  if (error) throw error

  revalidatePath('/companies')
  return data
}

export async function updateCompany(id: string, formData: Partial<Company>) {
  const { data, error } = await supabase
    .from('companies')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/companies')
  revalidatePath(`/companies/${id}`)
  return data
}

export async function deleteCompany(id: string) {
  // Companies table has been dropped from the database schema
  // This function is kept for backwards compatibility but should not be used
  throw new Error('Company functionality has been deprecated. Companies table no longer exists in the database.')
}

export async function updateCompanyStatus(id: string, status: CompanyStatus) {
  return updateCompany(id, { status })
}