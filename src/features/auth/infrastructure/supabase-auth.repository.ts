import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { AppError, normalizeError } from '@/core/errors'
import type { IAuthRepository } from '../domain/auth.repository'
import type {
  Credentials,
  DoctorProfile,
  DoctorProfilePatch,
  RegisterPayload,
  Session,
} from '../domain/auth.models'
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
        options: { data: { full_name: payload.fullName, role: 'doctor' } },
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

  async getProfile(userId: string): Promise<Result<DoctorProfile | null, AppError>> {
    try {
      const { data, error } = await this.client
        .from('Doctors')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) return err(normalizeError(error))
      return ok(data ? toDoctorProfile(data) : null)
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async createProfile(
    userId: string,
    data: { name: string; email: string },
  ): Promise<Result<DoctorProfile, AppError>> {
    try {
      const { data: row, error } = await this.client
        .from('Doctors')
        .insert({ user_id: userId, name: data.name, email: data.email })
        .select('*')
        .single()
      if (error) return err(normalizeError(error))
      return ok(toDoctorProfile(row))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async updateProfile(
    doctorId: number,
    patch: DoctorProfilePatch,
  ): Promise<Result<DoctorProfile, AppError>> {
    try {
      const { data, error } = await this.client
        .from('Doctors')
        .update({
          name: patch.name,
          phone: patch.phone,
          title: patch.title,
          specialization: patch.specialization,
          bio: patch.bio,
          license_number: patch.licenseNumber,
          image: patch.image,
          consultation_fee: patch.consultationFee,
          location: patch.location,
        })
        .eq('id', doctorId)
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
