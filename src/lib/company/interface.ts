export type CompanyStatus = 'active' | 'inactive' | 'suspended'
export type MemberRole = 'owner' | 'admin' | 'editor' | 'viewer'

export interface Company {
    id: string
    name: string
    slug: string
    logo_url: string | null
    description: string | null
    website_url: string | null
    owner_id: string
    status: CompanyStatus
    settings: Record<string, any>
    created_at: string
    updated_at: string
}

export interface CompanyMember {
    id: string
    company_id: string
    user_id: string
    role: MemberRole
    invited_by: string | null
    invited_at: string
    accepted_at: string | null
    created_at: string
}

export interface CompanyWithStats extends Company {
    _count?: {
        members: number
        websites: number
        articles: number
    }
}