/** Domain models for authentication & the doctor profile (the Doctors row). */

export interface AuthUser {
  id: string
  email: string
}

export interface Session {
  user: AuthUser
  accessToken: string
  expiresAt: number | null
}

/** The authenticated doctor — backed by a row in the `Doctors` table. */
export interface DoctorProfile {
  id: number
  userId: string | null
  name: string
  email: string | null
  phone: string | null
  title: string | null
  specialization: string | null
  specialtyId: number | null
  clinicId: number | null
  bio: string | null
  licenseNumber: string | null
  image: string | null
  consultationFee: number | null
  location: string | null
  rating: number | null
  waitingTime: number | null
}

export interface Credentials {
  email: string
  password: string
}

export interface RegisterPayload extends Credentials {
  fullName: string
}

export type DoctorProfilePatch = Partial<
  Pick<
    DoctorProfile,
    | 'name'
    | 'phone'
    | 'title'
    | 'specialization'
    | 'bio'
    | 'licenseNumber'
    | 'image'
    | 'consultationFee'
    | 'location'
  >
>
