import type { Result } from '@/core/result'
import { err, ok } from '@/core/result'
import { AppError } from '@/core/errors'
import type { IAuthRepository } from '../domain/auth.repository'
import type {
  Credentials,
  DoctorProfile,
  DoctorProfilePatch,
  RegisterPayload,
  Session,
} from '../domain/auth.models'

/**
 * Application service orchestrating authentication workflows. Depends only on
 * the IAuthRepository abstraction (DIP).
 */
export class AuthService {
  constructor(private readonly repo: IAuthRepository) {}

  getSession(): Promise<Result<Session | null, AppError>> {
    return this.repo.getSession()
  }

  signIn(credentials: Credentials): Promise<Result<Session, AppError>> {
    return this.repo.signIn(credentials)
  }

  register(payload: RegisterPayload): Promise<Result<Session | null, AppError>> {
    return this.repo.signUp(payload)
  }

  signOut(): Promise<Result<void, AppError>> {
    return this.repo.signOut()
  }

  requestPasswordReset(email: string): Promise<Result<void, AppError>> {
    if (!email) return Promise.resolve(err(AppError.validation('Email is required.')))
    return this.repo.sendPasswordReset(email)
  }

  /**
   * The shortest password this will accept.
   *
   * Supabase refuses under six, but the ones that arrive here were typed by a
   * person who was just told to change one and wants to get on with their
   * day. Eight is the point where that impulse stops producing a password
   * weaker than the issued one it replaces.
   */
  static readonly MIN_PASSWORD = 8

  changePassword(newPassword: string, confirmation: string): Promise<Result<Session, AppError>> {
    if (newPassword.length < AuthService.MIN_PASSWORD) {
      return Promise.resolve(
        err(AppError.validation(`Password must be at least ${AuthService.MIN_PASSWORD} characters.`)),
      )
    }
    if (newPassword !== confirmation) {
      return Promise.resolve(err(AppError.validation('The two passwords do not match.')))
    }
    return this.repo.changePassword(newPassword)
  }

  loadProfile(userId: string): Promise<Result<DoctorProfile | null, AppError>> {
    return this.repo.getProfile(userId)
  }

  /**
   * The doctor record this account is linked to.
   *
   * It does NOT create one when there is no match. A Doctors row is created by
   * the admin, who sets the specialty, clinic, fee and email; the account is
   * then linked to it by matching that confirmed address. Inventing a row here
   * produced a doctor with no specialty, no clinic and no schedule, invisible
   * to patients and sitting beside the real record the admin had already made.
   *
   * Since row level security also allows only an admin to insert into Doctors,
   * that path could no longer succeed anyway -- it would fail with a permission
   * error that says nothing about the actual problem.
   */
  async loadLinkedProfile(userId: string): Promise<Result<DoctorProfile, AppError>> {
    const existing = await this.repo.getProfile(userId)
    if (!existing.ok) return err(existing.error)
    if (existing.value) return ok(existing.value)
    return err(
      AppError.permission(
        'This account is not linked to a doctor yet. Ask the clinic administrator to add you with this email address.',
      ),
    )
  }

  updateProfile(doctorId: number, patch: DoctorProfilePatch): Promise<Result<DoctorProfile, AppError>> {
    return this.repo.updateProfile(doctorId, patch)
  }

  observe(callback: (session: Session | null) => void): () => void {
    return this.repo.onAuthStateChange(callback)
  }
}
