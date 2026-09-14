import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type {
  Appointment,
  AppointmentListQuery,
  AppointmentListResult,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from './appointment.models'

export interface IAppointmentRepository {
  list(
    doctorId: number,
    query: AppointmentListQuery,
  ): Promise<Result<AppointmentListResult, AppError>>
  /** Today's bookings for this doctor, in the order patients were given. */
  listQueue(doctorId: number, date: string): Promise<Result<Appointment[], AppError>>
  getById(id: number): Promise<Result<Appointment, AppError>>
  /** No doctor id: the database takes it from the signed-in account, so a
   *  dashboard cannot write a booking into somebody else's day. */
  create(input: CreateAppointmentInput): Promise<Result<Appointment, AppError>>
  update(id: number, input: UpdateAppointmentInput): Promise<Result<Appointment, AppError>>
  updateStatus(id: number, status: string): Promise<Result<Appointment, AppError>>
  remove(id: number): Promise<Result<void, AppError>>
}
