import type { Result } from '@/core/result'
import { err, ok } from '@/core/result'
import { AppError } from '@/core/errors'
import type { IAuthRepository } from '../domain/auth.repository'
import type { Credentials, DoctorProfile, RegisterPayload, Session } from '../domain/auth.models'

/**
 * Application service orchestrating authentication workflows. Depends only on
 * the IAuthRepository abstraction (DIP) — no Supabase imports here.
 */
export class AuthService {
  constructor(private readonly repo: IAuthRepository) {}

  getSession(): Promise<Result<Session | null, AppError>> {
    return this.repo.getSession()
  }

  signIn(credentials: Credentials): Promise<Result<Session, AppError>> {
    return this.repo.signIn(credentials)
  }

  async register(payload: RegisterPayload): Promise<Result<Session | null, AppError>> {
    return this.repo.signUp(payload)
  }

  signOut(): Promise<Result<void, AppError>> {
    return this.repo.signOut()
  }

  async requestPasswordReset(email: string): Promise<Result<void, AppError>> {
    if (!email) return err(AppError.validation('Email is required.'))
    return this.repo.sendPasswordReset(email)
  }

  loadProfile(userId: string): Promise<Result<DoctorProfile, AppError>> {
    return this.repo.getProfile(userId)
  }

  async updateProfile(
    userId: string,
    patch: Partial<Omit<DoctorProfile, 'id' | 'email' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Result<DoctorProfile, AppError>> {
    const result = await this.repo.updateProfile(userId, patch)
    return result.ok ? ok(result.value) : err(result.error)
  }

  observe(callback: (session: Session | null) => void): () => void {
    return this.repo.onAuthStateChange(callback)
  }
}
