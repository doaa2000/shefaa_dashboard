import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type {
  ScheduleEntry,
  CreateScheduleInput,
  UpdateScheduleInput,
  ScheduleClosure,
  CreateClosureInput,
} from './schedule.models'

export interface IScheduleRepository {
  list(doctorId: number): Promise<Result<ScheduleEntry[], AppError>>
  create(doctorId: number, input: CreateScheduleInput): Promise<Result<ScheduleEntry, AppError>>
  update(id: number, input: UpdateScheduleInput): Promise<Result<ScheduleEntry, AppError>>
  remove(id: number): Promise<Result<void, AppError>>

  /** Days off, from today forward. Past ones are history nobody acts on. */
  listClosures(doctorId: number): Promise<Result<ScheduleClosure[], AppError>>
  addClosure(
    doctorId: number,
    input: CreateClosureInput,
  ): Promise<Result<ScheduleClosure, AppError>>
  removeClosure(id: number): Promise<Result<void, AppError>>

  /** How many bookings already sit on that date -- the whole date when the
   *  session is null. Closing a day does not tell anybody, so the doctor needs
   *  to know who they are about to leave standing at the door. */
  countBookingsOn(
    doctorId: number,
    date: string,
    session: string | null,
  ): Promise<Result<number, AppError>>
}
