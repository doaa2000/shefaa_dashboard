import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { Credentials, DoctorProfile, RegisterPayload, Session } from './auth.models'

/**
 * Auth repository abstraction (DIP). The application layer depends only on this
 * interface; concrete Supabase implementation lives in infrastructure.
 */
export interface IAuthRepository {
  getSession(): Promise<Result<Session | null, AppError>>
  signIn(credentials: Credentials): Promise<Result<Session, AppError>>
  signUp(payload: RegisterPayload): Promise<Result<Session | null, AppError>>
  signOut(): Promise<Result<void, AppError>>
  sendPasswordReset(email: string): Promise<Result<void, AppError>>
  getProfile(userId: string): Promise<Result<DoctorProfile, AppError>>
  updateProfile(
    userId: string,
    patch: Partial<Omit<DoctorProfile, 'id' | 'email' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Result<DoctorProfile, AppError>>
  onAuthStateChange(callback: (session: Session | null) => void): () => void
}
