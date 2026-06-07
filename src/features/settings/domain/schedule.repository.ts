import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { CreateScheduleInput, DoctorSchedule, UpdateScheduleInput } from './schedule.models'

export interface IScheduleRepository {
  list(doctorId: string): Promise<Result<DoctorSchedule[], AppError>>
  create(doctorId: string, input: CreateScheduleInput): Promise<Result<DoctorSchedule, AppError>>
  update(id: string, input: UpdateScheduleInput): Promise<Result<DoctorSchedule, AppError>>
  remove(id: string): Promise<Result<void, AppError>>
}
