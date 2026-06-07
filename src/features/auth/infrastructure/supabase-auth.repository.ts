import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { AppError, normalizeError } from '@/core/errors'
import type { IAuthRepository } from '../domain/auth.repository'
import type { Credentials, DoctorProfile, RegisterPayload, Session } from '../domain/auth.models'
import { toDoctorProfile, toSession } from './auth.mapper'

export class SupabaseAuthRepository implements IAuthRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async getSession(): Promise<Result<Session | null, AppError>> {
    try {
      const { data, error } = await this.client.auth.getSession()
      if (error) return err(normalizeError(error))
      return ok(toSession(data.session))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async signIn(credentials: Credentials): Promise<Result<Session, AppError>> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword(credentials)
      if (error) return err(normalizeError(error))
      const session = toSession(data.session)
      if (!session) return err(AppError.auth('Unable to start a session.'))
      return ok(session)
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async signUp(payload: RegisterPayload): Promise<Result<Session | null, AppError>> {
    try {
      const { data, error } = await this.client.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: { data: { full_name: payload.fullName } },
      })
      if (error) return err(normalizeError(error))
      return ok(toSession(data.session))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async signOut(): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client.auth.signOut()
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async sendPasswordReset(email: string): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async getProfile(userId: string): Promise<Result<DoctorProfile, AppError>> {
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) return err(normalizeError(error))
      return ok(toDoctorProfile(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async updateProfile(
    userId: string,
    patch: Partial<Omit<DoctorProfile, 'id' | 'email' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Result<DoctorProfile, AppError>> {
    try {
      const { data, error } = await this.client
        .from('profiles')
        .update({
          full_name: patch.fullName,
          phone: patch.phone,
          avatar_url: patch.avatarUrl,
          specialty: patch.specialty,
          bio: patch.bio,
          license_number: patch.licenseNumber,
          clinic_name: patch.clinicName,
          timezone: patch.timezone,
        })
        .eq('id', userId)
        .select('*')
        .single()
      if (error) return err(normalizeError(error))
      return ok(toDoctorProfile(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  onAuthStateChange(callback: (session: Session | null) => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      callback(toSession(session))
    })
    return () => data.subscription.unsubscribe()
  }
}
