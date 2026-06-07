import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type {
  Appointment,
  AppointmentListQuery,
  AppointmentListResult,
  AppointmentStatus,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from './appointment.models'

export interface IAppointmentRepository {
  list(
    doctorId: string,
    query: AppointmentListQuery,
  ): Promise<Result<AppointmentListResult, AppError>>
  getById(id: string): Promise<Result<Appointment, AppError>>
  create(doctorId: string, input: CreateAppointmentInput): Promise<Result<Appointment, AppError>>
  update(id: string, input: UpdateAppointmentInput): Promise<Result<Appointment, AppError>>
  updateStatus(id: string, status: AppointmentStatus): Promise<Result<Appointment, AppError>>
  remove(id: string): Promise<Result<void, AppError>>
}
