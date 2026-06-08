import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type {
  Credentials,
  DoctorProfile,
  DoctorProfilePatch,
  RegisterPayload,
  Session,
} from './auth.models'

/**
 * Auth repository abstraction (DIP). The application layer depends only on this
 * interface; the concrete Supabase implementation lives in infrastructure.
 */
export interface IAuthRepository {
  getSession(): Promise<Result<Session | null, AppError>>
  signIn(credentials: Credentials): Promise<Result<Session, AppError>>
  signUp(payload: RegisterPayload): Promise<Result<Session | null, AppError>>
  signOut(): Promise<Result<void, AppError>>
  sendPasswordReset(email: string): Promise<Result<void, AppError>>
  /** Returns the Doctors row linked to the auth user, or null if not linked yet. */
  getProfile(userId: string): Promise<Result<DoctorProfile | null, AppError>>
  /** Creates the Doctors row for a freshly registered doctor. */
  createProfile(
    userId: string,
    data: { name: string; email: string },
  ): Promise<Result<DoctorProfile, AppError>>
  updateProfile(doctorId: number, patch: DoctorProfilePatch): Promise<Result<DoctorProfile, AppError>>
  onAuthStateChange(callback: (session: Session | null) => void): () => void
}
