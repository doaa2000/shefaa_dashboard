import type { Session as SupabaseSession } from '@supabase/supabase-js'
import type { Tables } from '@/core/types/database.types'
import type { DoctorProfile, Session } from '../domain/auth.models'

export function toSession(session: SupabaseSession | null): Session | null {
  if (!session?.user) return null
  return {
    user: { id: session.user.id, email: session.user.email ?? '' },
    accessToken: session.access_token,
    expiresAt: session.expires_at ?? null,
  }
}

export function toDoctorProfile(row: Tables<'profiles'>): DoctorProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    specialty: row.specialty,
    bio: row.bio,
    licenseNumber: row.license_number,
    clinicName: row.clinic_name,
    timezone: row.timezone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
