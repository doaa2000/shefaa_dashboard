import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type {
  AvailabilitySlot,
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
} from './schedule.models'

export interface IScheduleRepository {
  list(doctorId: number): Promise<Result<AvailabilitySlot[], AppError>>
  create(doctorId: number, input: CreateAvailabilityInput): Promise<Result<AvailabilitySlot, AppError>>
  update(id: number, input: UpdateAvailabilityInput): Promise<Result<AvailabilitySlot, AppError>>
  remove(id: number): Promise<Result<void, AppError>>
}
