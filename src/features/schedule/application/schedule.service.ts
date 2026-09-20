import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { IScheduleRepository } from '../domain/schedule.repository'
import type {
  ScheduleEntry,
  CreateScheduleInput,
  UpdateScheduleInput,
  ScheduleClosure,
  CreateClosureInput,
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

  setBookingMode(
    doctorId: number,
    slotMinutes: number | null,
  ): Promise<Result<ScheduleEntry[], AppError>> {
    return this.repo.setBookingMode(doctorId, slotMinutes)
  }

  listClosures(doctorId: number): Promise<Result<ScheduleClosure[], AppError>> {
    return this.repo.listClosures(doctorId)
  }

  addClosure(
    doctorId: number,
    input: CreateClosureInput,
  ): Promise<Result<ScheduleClosure, AppError>> {
    return this.repo.addClosure(doctorId, input)
  }

  removeClosure(id: number): Promise<Result<void, AppError>> {
    return this.repo.removeClosure(id)
  }

  countBookingsOn(
    doctorId: number,
    date: string,
    session: string | null,
  ): Promise<Result<number, AppError>> {
    return this.repo.countBookingsOn(doctorId, date, session)
  }
}
