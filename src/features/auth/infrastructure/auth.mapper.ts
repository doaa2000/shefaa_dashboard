import type { Session as SupabaseSession } from '@supabase/supabase-js'
import type { Tables } from '@/core/types/database.types'
import type { DoctorProfile, Session } from '../domain/auth.models'

export function toSession(session: SupabaseSession | null): Session | null {
  if (!session?.user) return null
  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? '',
      // Written by the doctor-account function when it issues a password, and
      // cleared here by changePassword. Absent on every account that was never
      // given one, which reads as false -- the right answer for a doctor who
      // chose their own password from the start.
      mustChangePassword: session.user.user_metadata?.must_change_password === true,
    },
    accessToken: session.access_token,
    expiresAt: session.expires_at ?? null,
  }
}

export function toDoctorProfile(row: Tables<'Doctors'>): DoctorProfile {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    title: row.title,
    specialization: row.specialization,
    specialtyId: row.specialty_id,
    clinicId: row.clinic_id,
    bio: row.bio,
    licenseNumber: row.license_number,
    image: row.image,
    consultationFee: row.consultation_fee,
    location: row.location,
    rating: row.rating,
    waitingTime: row.waiting_time,
  }
}
