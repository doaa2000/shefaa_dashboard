import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { IAppointmentRepository } from '../domain/appointment.repository'
import type {
  Appointment,
  AppointmentListQuery,
  AppointmentListResult,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '../domain/appointment.models'
import { toAppointment, toInsert, toUpdate } from './appointment.mapper'

const SELECT = '*, profiles(name)'

export class SupabaseAppointmentRepository implements IAppointmentRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async list(
    doctorId: number,
    query: AppointmentListQuery,
  ): Promise<Result<AppointmentListResult, AppError>> {
    try {
      let q = this.client
        .from('bookings')
        .select(SELECT, { count: 'exact' })
        .eq('doctor_id', doctorId)
        .order('booked_date', { ascending: true })
        .order('start_time', { ascending: true })
        .range(query.from, query.to)

      if (query.status) q = q.eq('status', query.status)
      if (query.fromDate) q = q.gte('booked_date', query.fromDate)
      if (query.toDate) q = q.lte('booked_date', query.toDate)

      const { data, error, count } = await q
      if (error) return err(normalizeError(error))
      return ok({ items: data.map(toAppointment), total: count ?? 0 })
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async getById(id: number): Promise<Result<Appointment, AppError>> {
    try {
      const { data, error } = await this.client.from('bookings').select(SELECT).eq('id', id).single()
      if (error) return err(normalizeError(error))
      return ok(toAppointment(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async create(
    doctorId: number,
    input: CreateAppointmentInput,
  ): Promise<Result<Appointment, AppError>> {
    try {
      const { data, error } = await this.client
        .from('bookings')
        .insert(toInsert(doctorId, input))
        .select(SELECT)
        .single()
      if (error) return err(normalizeError(error))
      return ok(toAppointment(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async update(id: number, input: UpdateAppointmentInput): Promise<Result<Appointment, AppError>> {
    try {
      const { data, error } = await this.client
        .from('bookings')
        .update(toUpdate(input))
        .eq('id', id)
        .select(SELECT)
        .single()
      if (error) return err(normalizeError(error))
      return ok(toAppointment(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  updateStatus(id: number, status: string): Promise<Result<Appointment, AppError>> {
    return this.update(id, { status })
  }

  async remove(id: number): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client.from('bookings').delete().eq('id', id)
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
