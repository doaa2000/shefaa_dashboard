/** Domain models for authentication & the doctor profile (the Doctors row). */

export interface AuthUser {
  id: string
  email: string
  /**
   * Whether this password was issued by an admin and has not been replaced.
   *
   * A first password is handed over by hand -- read down a phone, sent in a
   * message -- so it has been somewhere the doctor does not control before
   * they ever use it. It stands until they choose their own, and the
   * dashboard does not open until they do.
   */
  mustChangePassword: boolean
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
