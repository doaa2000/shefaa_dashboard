import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type {
  Appointment,
  AppointmentListQuery,
  AppointmentListResult,
  BookableWindow,
  ClinicBookingResult,
  RecordClinicBookingInput,
  UpdateAppointmentInput,
} from './appointment.models'

export interface IAppointmentRepository {
  list(
    doctorId: number,
    query: AppointmentListQuery,
  ): Promise<Result<AppointmentListResult, AppError>>
  /** Today's bookings for this doctor, in the order patients were given. */
  getById(id: number): Promise<Result<Appointment, AppError>>
  update(id: number, input: UpdateAppointmentInput): Promise<Result<Appointment, AppError>>
  updateStatus(id: number, status: string): Promise<Result<Appointment, AppError>>
  remove(id: number): Promise<Result<void, AppError>>
  /** The windows this doctor is offering on a date, with how full each is. */
  windowsOn(doctorId: number, date: string): Promise<Result<BookableWindow[], AppError>>
  recordClinicBooking(
    input: RecordClinicBookingInput,
  ): Promise<Result<ClinicBookingResult, AppError>>
}
