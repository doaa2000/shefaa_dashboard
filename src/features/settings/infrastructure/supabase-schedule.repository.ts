import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { Tables } from '@/core/types/database.types'
import type { IScheduleRepository } from '../domain/schedule.repository'
import type {
  AvailabilitySlot,
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
} from '../domain/schedule.models'

function toSlot(row: Tables<'doctor_availability'>): AvailabilitySlot {
  return {
    id: row.id,
    doctorId: row.doctor_id ?? 0,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    session: row.session,
    isActive: row.is_active ?? true,
  }
}

export class SupabaseScheduleRepository implements IScheduleRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async list(doctorId: number): Promise<Result<AvailabilitySlot[], AppError>> {
    try {
      const { data, error } = await this.client
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
      if (error) return err(normalizeError(error))
      return ok(data.map(toSlot))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async create(
    doctorId: number,
    input: CreateAvailabilityInput,
  ): Promise<Result<AvailabilitySlot, AppError>> {
    try {
      const { data, error } = await this.client
        .from('doctor_availability')
        .insert({
          doctor_id: doctorId,
          date: input.date,
          start_time: input.startTime,
          end_time: input.endTime,
          session: input.session,
          is_active: input.isActive,
        })
        .select('*')
        .single()
      if (error) return err(normalizeError(error))
      return ok(toSlot(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async update(
    id: number,
    input: UpdateAvailabilityInput,
  ): Promise<Result<AvailabilitySlot, AppError>> {
    try {
      const { data, error } = await this.client
        .from('doctor_availability')
        .update({
          date: input.date,
          start_time: input.startTime,
          end_time: input.endTime,
          session: input.session,
          is_active: input.isActive,
        })
        .eq('id', id)
        .select('*')
        .single()
      if (error) return err(normalizeError(error))
      return ok(toSlot(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async remove(id: number): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client.from('doctor_availability').delete().eq('id', id)
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
