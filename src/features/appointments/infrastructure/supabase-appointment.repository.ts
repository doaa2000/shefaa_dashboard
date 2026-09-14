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
import { toAppointment, toUpdate } from './appointment.mapper'

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

  async listQueue(doctorId: number, date: string): Promise<Result<Appointment[], AppError>> {
    try {
      // By window first, then by when the booking was made. The store groups
      // on start_time, so the day reads in the order it happens; inside one
      // window the booking order is only a way to list people, not the order
      // the doctor calls them -- that is arrival order, and the walk-ins
      // standing in the room are not in this table at all.
      const { data, error } = await this.client
        .from('bookings')
        .select(SELECT)
        .eq('doctor_id', doctorId)
        .eq('booked_date', date)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true })
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })

      if (error) return err(normalizeError(error))
      return ok(data.map(toAppointment))
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

  async create(input: CreateAppointmentInput): Promise<Result<Appointment, AppError>> {
    try {
      // Through the function, not a plain insert: a booking written straight
      // into the table carries no payment, so the visit happened and the fee
      // existed nowhere -- not on the payments page, not in the day's takings.
      // doctor_create_booking writes both in one transaction.
      const { data, error } = await this.client.rpc('doctor_create_booking', {
        p_patient: input.patientId,
        p_date: input.bookedDate,
        p_session: input.session,
        p_start: input.startTime,
        p_end: input.endTime,
        p_method: input.paymentMethod,
        p_amount: input.amount ?? undefined,
        p_paid: input.paid,
        p_status: input.status,
      })
      if (error) return err(normalizeError(error))

      const created = data as { bookingId: number } | null
      if (!created) return err(normalizeError(new Error('No booking returned')))

      // Read it back rather than assemble it here: the row now carries a
      // payment id and whatever the database settled on, and the list should
      // show that, not this function's idea of it.
      const { data: row, error: readError } = await this.client
        .from('bookings')
        .select(SELECT)
        .eq('id', created.bookingId)
        .single()
      if (readError) return err(normalizeError(readError))
      return ok(toAppointment(row))
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
