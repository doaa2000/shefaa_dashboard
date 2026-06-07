/** Domain models for authentication & the doctor profile. */

export interface AuthUser {
  id: string
  email: string
}

export interface Session {
  user: AuthUser
  accessToken: string
  expiresAt: number | null
}

export interface DoctorProfile {
  id: string
  email: string
  fullName: string
  phone: string | null
  avatarUrl: string | null
  specialty: string | null
  bio: string | null
  licenseNumber: string | null
  clinicName: string | null
  timezone: string
  createdAt: string
  updatedAt: string
}

export interface Credentials {
  email: string
  password: string
}

export interface RegisterPayload extends Credentials {
  fullName: string
}
