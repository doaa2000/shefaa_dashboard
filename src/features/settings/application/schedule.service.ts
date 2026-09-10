import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { IScheduleRepository } from '../domain/schedule.repository'
import type {
  ScheduleEntry,
  CreateScheduleInput,
  UpdateScheduleInput,
} from '../domain/schedule.models'

export class ScheduleService {
  constructor(private readonly repo: IScheduleRepository) {}

  list(doctorId: number): Promise<Result<ScheduleEntry[], AppError>> {
    return this.repo.list(doctorId)
  }

  create(doctorId: number, input: CreateScheduleInput): Promise<Result<ScheduleEntry, AppError>> {
    return this.repo.create(doctorId, input)
  }

  update(id: number, input: UpdateScheduleInput): Promise<Result<ScheduleEntry, AppError>> {
    return this.repo.update(id, input)
  }

  remove(id: number): Promise<Result<void, AppError>> {
    return this.repo.remove(id)
  }
}
