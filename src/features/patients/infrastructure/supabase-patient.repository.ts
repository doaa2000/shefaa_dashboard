import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { IPatientRepository } from '../domain/patient.repository'
import type { Patient } from '../domain/patient.models'
import { toPatient } from './patient.mapper'

export class SupabasePatientRepository implements IPatientRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async listForDoctor(search?: string): Promise<Result<Patient[], AppError>> {
    try {
      const { data, error } = await this.client.rpc('doctor_patients', { search: search ?? '' })
      if (error) return err(normalizeError(error))
      return ok((data ?? []).map(toPatient))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async getById(id: string): Promise<Result<Patient, AppError>> {
    try {
      const { data, error } = await this.client.from('profiles').select('*').eq('id', id).single()
      if (error) return err(normalizeError(error))
      return ok(toPatient(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
