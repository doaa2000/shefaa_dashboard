import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { Tables } from '@/core/types/database.types'
import type { IScheduleRepository } from '../domain/schedule.repository'
import type {
  ScheduleEntry,
  CreateScheduleInput,
  UpdateScheduleInput,
  ScheduleClosure,
  CreateClosureInput,
} from '../domain/schedule.models'

function toEntry(row: Tables<'doctor_schedule'>): ScheduleEntry {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    weekday: row.weekday,
    session: row.session,
    startTime: row.start_time,
    endTime: row.end_time,
    capacity: row.capacity,
    slotMinutes: row.slot_minutes,
    isActive: row.is_active,
  }
}

/** Only the fields that were actually supplied, so a partial update stays partial. */
function toRow(input: UpdateScheduleInput) {
  return {
    ...(input.weekday !== undefined && { weekday: input.weekday }),
    ...(input.session !== undefined && { session: input.session }),
    ...(input.startTime !== undefined && { start_time: input.startTime }),
    ...(input.endTime !== undefined && { end_time: input.endTime }),
    ...(input.capacity !== undefined && { capacity: input.capacity }),
    // null is a real value here -- it means "one window" -- so this checks for
    // undefined rather than falsiness, or clearing the setting would no-op.
    ...(input.slotMinutes !== undefined && { slot_minutes: input.slotMinutes }),
    ...(input.isActive !== undefined && { is_active: input.isActive }),
  }
}

export class SupabaseScheduleRepository implements IScheduleRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async list(doctorId: number): Promise<Result<ScheduleEntry[], AppError>> {
    try {
      const { data, error } = await this.client
        .from('doctor_schedule')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('weekday', { ascending: true })
        .order('start_time', { ascending: true })
      if (error) return err(normalizeError(error))
      return ok(data.map(toEntry))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async create(
    doctorId: number,
    input: CreateScheduleInput,
  ): Promise<Result<ScheduleEntry, AppError>> {
    try {
      const { data, error } = await this.client
        .from('doctor_schedule')
        .insert({
          doctor_id: doctorId,
          weekday: input.weekday,
          session: input.session,
          start_time: input.startTime,
          end_time: input.endTime,
          capacity: input.capacity,
          // Only when there is something to say. The column defaults to null,
          // which is exactly what "one window" means, so sending the null adds
          // nothing -- and makes an ordinary session impossible to add on a
          // project whose API has not picked the new column up yet.
          ...(input.slotMinutes !== null && { slot_minutes: input.slotMinutes }),
          is_active: input.isActive,
        })
        .select('*')
        .single()
      if (error) return err(normalizeError(error))
      return ok(toEntry(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async update(id: number, input: UpdateScheduleInput): Promise<Result<ScheduleEntry, AppError>> {
    try {
      const { data, error } = await this.client
        .from('doctor_schedule')
        .update(toRow(input))
        .eq('id', id)
        .select('*')
        .single()
      if (error) return err(normalizeError(error))
      return ok(toEntry(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async remove(id: number): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client.from('doctor_schedule').delete().eq('id', id)
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async listClosures(doctorId: number): Promise<Result<ScheduleClosure[], AppError>> {
    try {
      const { data, error } = await this.client
        .from('doctor_schedule_exceptions')
        .select('id, doctor_id, date, session, reason')
        // Today included: a day being closed while it runs is the most likely
        // reason anybody opens this list.
        .gte('date', new Date().toISOString().slice(0, 10))
        .eq('doctor_id', doctorId)
        .order('date', { ascending: true })
      if (error) return err(normalizeError(error))

      return ok(
        (data ?? []).map((row) => ({
          id: row.id,
          doctorId: row.doctor_id,
          date: row.date,
          session: row.session,
          reason: row.reason,
        })),
      )
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async addClosure(
    doctorId: number,
    input: CreateClosureInput,
  ): Promise<Result<ScheduleClosure, AppError>> {
    try {
      const { data, error } = await this.client
        .from('doctor_schedule_exceptions')
        .insert({
          doctor_id: doctorId,
          date: input.date,
          session: input.session,
          is_closed: true,
          reason: input.reason,
        })
        .select('id, doctor_id, date, session, reason')
        .single()
      if (error) return err(normalizeError(error))

      return ok({
        id: data.id,
        doctorId: data.doctor_id,
        date: data.date,
        session: data.session,
        reason: data.reason,
      })
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async removeClosure(id: number): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client
        .from('doctor_schedule_exceptions')
        .delete()
        .eq('id', id)
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async countBookingsOn(
    doctorId: number,
    date: string,
    session: string | null,
  ): Promise<Result<number, AppError>> {
    try {
      let q = this.client
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .eq('booked_date', date)
        // A cancelled booking is nobody waiting at the door.
        .neq('status', 'cancelled')
      if (session) q = q.eq('session', session)

      const { count, error } = await q
      if (error) return err(normalizeError(error))
      return ok(count ?? 0)
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
