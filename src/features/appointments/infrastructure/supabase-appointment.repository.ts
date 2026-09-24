import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { IAppointmentRepository } from '../domain/appointment.repository'
import type {
  Appointment,
  AppointmentListQuery,
  AppointmentListResult,
  BookableWindow,
  ClinicBookingResult,
  RecordClinicBookingInput,
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

  async getById(id: number): Promise<Result<Appointment, AppError>> {
    try {
      const { data, error } = await this.client.from('bookings').select(SELECT).eq('id', id).single()
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

  async windowsOn(doctorId: number, date: string): Promise<Result<BookableWindow[], AppError>> {
    try {
      const { data, error } = await this.client.rpc('doctor_sessions_on', {
        p_doctor: doctorId,
        p_date: date,
      })
      if (error) return err(normalizeError(error))
      return ok(
        (data ?? []).map((row) => ({
          session: row.session,
          // Postgres hands back seconds; every other time in this dashboard is
          // HH:MM, and the two must match or the select never finds its option.
          startTime: String(row.start_time).slice(0, 5),
          endTime: String(row.end_time).slice(0, 5),
          capacity: row.capacity,
          booked: Number(row.booked ?? 0),
          remaining: row.remaining,
          hasStarted: row.has_started,
        })),
      )
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async recordClinicBooking(
    input: RecordClinicBookingInput,
  ): Promise<Result<ClinicBookingResult, AppError>> {
    try {
      const { data, error } = await this.client.rpc('doctor_record_booking', {
        p_date: input.bookedDate,
        p_session: input.session,
        p_start: input.startTime,
        p_end: input.endTime,
        p_name: input.name,
        p_phone: input.phone ?? null,
        // Undefined and null both mean "the doctor's usual fee". Zero does
        // not, and has to survive the difference.
        p_amount: input.amount ?? null,
        p_paid: input.paid,
        p_method: input.method,
      })
      if (error) return err(normalizeError(error))
      const row = data as Record<string, unknown>
      return ok({
        bookingId: Number(row.bookingId),
        linked: Boolean(row.linked),
        amount: Number(row.amount ?? 0),
        capacity: row.capacity == null ? null : Number(row.capacity),
        booked: Number(row.booked ?? 0),
        overCapacity: Boolean(row.overCapacity),
      })
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
