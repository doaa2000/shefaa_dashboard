import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { ScheduleEntry, CreateScheduleInput, UpdateScheduleInput } from './schedule.models'

export interface IScheduleRepository {
  list(doctorId: number): Promise<Result<ScheduleEntry[], AppError>>
  create(doctorId: number, input: CreateScheduleInput): Promise<Result<ScheduleEntry, AppError>>
  update(id: number, input: UpdateScheduleInput): Promise<Result<ScheduleEntry, AppError>>
  remove(id: number): Promise<Result<void, AppError>>
}
