import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { IScheduleRepository } from '../domain/schedule.repository'
import type {
  AvailabilitySlot,
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
} from '../domain/schedule.models'

export class ScheduleService {
  constructor(private readonly repo: IScheduleRepository) {}

  list(doctorId: number): Promise<Result<AvailabilitySlot[], AppError>> {
    return this.repo.list(doctorId)
  }

  create(
    doctorId: number,
    input: CreateAvailabilityInput,
  ): Promise<Result<AvailabilitySlot, AppError>> {
    return this.repo.create(doctorId, input)
  }

  update(id: number, input: UpdateAvailabilityInput): Promise<Result<AvailabilitySlot, AppError>> {
    return this.repo.update(id, input)
  }

  remove(id: number): Promise<Result<void, AppError>> {
    return this.repo.remove(id)
  }
}
