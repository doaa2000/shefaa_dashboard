import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { IAppointmentRepository } from '../domain/appointment.repository'
import type {
  Appointment,
  AppointmentListQuery,
  AppointmentListResult,
  AppointmentStatus,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '../domain/appointment.models'
import { toAppointment, toInsert, toUpdate } from './appointment.mapper'

const SELECT_WITH_PATIENT = '*, patients(full_name)'

export class SupabaseAppointmentRepository implements IAppointmentRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async list(
    doctorId: string,
    query: AppointmentListQuery,
  ): Promise<Result<AppointmentListResult, AppError>> {
    try {
      let q = this.client
        .from('appointments')
        .select(SELECT_WITH_PATIENT, { count: 'exact' })
        .eq('doctor_id', doctorId)
        .order('scheduled_at', { ascending: true })
        .range(query.from, query.to)

      if (query.status) q = q.eq('status', query.status)
      if (query.fromDate) q = q.gte('scheduled_at', query.fromDate)
      if (query.toDate) q = q.lte('scheduled_at', query.toDate)

      const { data, error, count } = await q
      if (error) return err(normalizeError(error))
      return ok({ items: data.map(toAppointment), total: count ?? 0 })
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async getById(id: string): Promise<Result<Appointment, AppError>> {
    try {
      const { data, error } = await this.client
        .from('appointments')
        .select(SELECT_WITH_PATIENT)
        .eq('id', id)
        .single()
      if (error) return err(normalizeError(error))
      return ok(toAppointment(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async create(
    doctorId: string,
    input: CreateAppointmentInput,
  ): Promise<Result<Appointment, AppError>> {
    try {
      const { data, error } = await this.client
        .from('appointments')
        .insert(toInsert(doctorId, input))
        .select(SELECT_WITH_PATIENT)
        .single()
      if (error) return err(normalizeError(error))
      return ok(toAppointment(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async update(id: string, input: UpdateAppointmentInput): Promise<Result<Appointment, AppError>> {
    try {
      const { data, error } = await this.client
        .from('appointments')
        .update(toUpdate(input))
        .eq('id', id)
        .select(SELECT_WITH_PATIENT)
        .single()
      if (error) return err(normalizeError(error))
      return ok(toAppointment(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  updateStatus(id: string, status: AppointmentStatus): Promise<Result<Appointment, AppError>> {
    return this.update(id, { status })
  }

  async remove(id: string): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client.from('appointments').delete().eq('id', id)
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
