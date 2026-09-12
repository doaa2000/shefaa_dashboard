import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { Tables } from '@/core/types/database.types'
import type { IScheduleRepository } from '../domain/schedule.repository'
import type {
  ScheduleEntry,
  CreateScheduleInput,
  UpdateScheduleInput,
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
          slot_minutes: input.slotMinutes,
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
}
