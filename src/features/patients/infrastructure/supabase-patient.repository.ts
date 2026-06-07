import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { IPatientRepository } from '../domain/patient.repository'
import type {
  CreatePatientInput,
  Patient,
  PatientListQuery,
  PatientListResult,
  UpdatePatientInput,
} from '../domain/patient.models'
import { toInsert, toPatient, toUpdate } from './patient.mapper'

export class SupabasePatientRepository implements IPatientRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async list(
    doctorId: string,
    query: PatientListQuery,
  ): Promise<Result<PatientListResult, AppError>> {
    try {
      let q = this.client
        .from('patients')
        .select('*', { count: 'exact' })
        .eq('doctor_id', doctorId)
        .order('full_name', { ascending: true })
        .range(query.from, query.to)

      if (query.search) q = q.ilike('full_name', `%${query.search}%`)
      if (query.isActive !== undefined) q = q.eq('is_active', query.isActive)

      const { data, error, count } = await q
      if (error) return err(normalizeError(error))
      return ok({ items: data.map(toPatient), total: count ?? 0 })
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async getById(id: string): Promise<Result<Patient, AppError>> {
    try {
      const { data, error } = await this.client.from('patients').select('*').eq('id', id).single()
      if (error) return err(normalizeError(error))
      return ok(toPatient(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async create(doctorId: string, input: CreatePatientInput): Promise<Result<Patient, AppError>> {
    try {
      const { data, error } = await this.client
        .from('patients')
        .insert(toInsert(doctorId, input))
        .select('*')
        .single()
      if (error) return err(normalizeError(error))
      return ok(toPatient(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async update(id: string, input: UpdatePatientInput): Promise<Result<Patient, AppError>> {
    try {
      const { data, error } = await this.client
        .from('patients')
        .update(toUpdate(input))
        .eq('id', id)
        .select('*')
        .single()
      if (error) return err(normalizeError(error))
      return ok(toPatient(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async remove(id: string): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client.from('patients').delete().eq('id', id)
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
