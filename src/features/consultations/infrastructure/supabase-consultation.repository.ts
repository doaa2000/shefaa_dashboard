import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { IConsultationRepository } from '../domain/consultation.repository'
import type {
  Consultation,
  ConsultationListQuery,
  ConsultationListResult,
  CreateConsultationInput,
  UpdateConsultationInput,
} from '../domain/consultation.models'
import { toConsultation, toInsert, toUpdate } from './consultation.mapper'

const SELECT = '*, profiles(name)'

export class SupabaseConsultationRepository implements IConsultationRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async list(
    doctorId: number,
    query: ConsultationListQuery,
  ): Promise<Result<ConsultationListResult, AppError>> {
    try {
      let q = this.client
        .from('consultations')
        .select(SELECT, { count: 'exact' })
        .eq('doctor_id', doctorId)
        .order('consulted_at', { ascending: false })
        .range(query.from, query.to)

      if (query.patientId) q = q.eq('patient_id', query.patientId)
      if (query.status) q = q.eq('status', query.status)

      const { data, error, count } = await q
      if (error) return err(normalizeError(error))
      return ok({ items: data.map(toConsultation), total: count ?? 0 })
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async getById(id: string): Promise<Result<Consultation, AppError>> {
    try {
      const { data, error } = await this.client.from('consultations').select(SELECT).eq('id', id).single()
      if (error) return err(normalizeError(error))
      return ok(toConsultation(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async create(
    doctorId: number,
    input: CreateConsultationInput,
  ): Promise<Result<Consultation, AppError>> {
    try {
      const { data, error } = await this.client
        .from('consultations')
        .insert(toInsert(doctorId, input))
        .select(SELECT)
        .single()
      if (error) return err(normalizeError(error))
      return ok(toConsultation(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async update(id: string, input: UpdateConsultationInput): Promise<Result<Consultation, AppError>> {
    try {
      const { data, error } = await this.client
        .from('consultations')
        .update(toUpdate(input))
        .eq('id', id)
        .select(SELECT)
        .single()
      if (error) return err(normalizeError(error))
      return ok(toConsultation(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async remove(id: string): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client.from('consultations').delete().eq('id', id)
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
