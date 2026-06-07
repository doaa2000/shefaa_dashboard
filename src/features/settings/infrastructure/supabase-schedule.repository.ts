import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { Tables } from '@/core/types/database.types'
import type { IScheduleRepository } from '../domain/schedule.repository'
import type {
  CreateScheduleInput,
  DoctorSchedule,
  UpdateScheduleInput,
} from '../domain/schedule.models'

function toSchedule(row: Tables<'doctor_schedules'>): DoctorSchedule {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    weekday: row.weekday,
    startTime: row.start_time,
    endTime: row.end_time,
    slotDurationMinutes: row.slot_duration_minutes,
    isActive: row.is_active,
  }
}

export class SupabaseScheduleRepository implements IScheduleRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async list(doctorId: string): Promise<Result<DoctorSchedule[], AppError>> {
    try {
      const { data, error } = await this.client
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('weekday', { ascending: true })
        .order('start_time', { ascending: true })
      if (error) return err(normalizeError(error))
      return ok(data.map(toSchedule))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async create(
    doctorId: string,
    input: CreateScheduleInput,
  ): Promise<Result<DoctorSchedule, AppError>> {
    try {
      const { data, error } = await this.client
        .from('doctor_schedules')
        .insert({
          doctor_id: doctorId,
          weekday: input.weekday,
          start_time: input.startTime,
          end_time: input.endTime,
          slot_duration_minutes: input.slotDurationMinutes,
          is_active: input.isActive,
        })
        .select('*')
        .single()
      if (error) return err(normalizeError(error))
      return ok(toSchedule(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async update(id: string, input: UpdateScheduleInput): Promise<Result<DoctorSchedule, AppError>> {
    try {
      const { data, error } = await this.client
        .from('doctor_schedules')
        .update({
          weekday: input.weekday,
          start_time: input.startTime,
          end_time: input.endTime,
          slot_duration_minutes: input.slotDurationMinutes,
          is_active: input.isActive,
        })
        .eq('id', id)
        .select('*')
        .single()
      if (error) return err(normalizeError(error))
      return ok(toSchedule(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async remove(id: string): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client.from('doctor_schedules').delete().eq('id', id)
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
