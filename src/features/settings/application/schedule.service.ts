import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { IScheduleRepository } from '../domain/schedule.repository'
import type {
  CreateScheduleInput,
  DoctorSchedule,
  UpdateScheduleInput,
} from '../domain/schedule.models'

export class ScheduleService {
  constructor(private readonly repo: IScheduleRepository) {}

  list(doctorId: string): Promise<Result<DoctorSchedule[], AppError>> {
    return this.repo.list(doctorId)
  }

  create(doctorId: string, input: CreateScheduleInput): Promise<Result<DoctorSchedule, AppError>> {
    return this.repo.create(doctorId, input)
  }

  update(id: string, input: UpdateScheduleInput): Promise<Result<DoctorSchedule, AppError>> {
    return this.repo.update(id, input)
  }

  remove(id: string): Promise<Result<void, AppError>> {
    return this.repo.remove(id)
  }
}
