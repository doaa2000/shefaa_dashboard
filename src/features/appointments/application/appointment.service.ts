import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { IAppointmentRepository } from '../domain/appointment.repository'
import type {
  Appointment,
  AppointmentListQuery,
  AppointmentListResult,
  BookableWindow,
  ClinicBookingResult,
  RecordClinicBookingInput,
  UpdateAppointmentInput,
} from '../domain/appointment.models'

export class AppointmentService {
  constructor(private readonly repo: IAppointmentRepository) {}

  list(
    doctorId: number,
    query: AppointmentListQuery,
  ): Promise<Result<AppointmentListResult, AppError>> {
    return this.repo.list(doctorId, query)
  }


  getById(id: number): Promise<Result<Appointment, AppError>> {
    return this.repo.getById(id)
  }

  update(id: number, input: UpdateAppointmentInput): Promise<Result<Appointment, AppError>> {
    return this.repo.update(id, input)
  }

  setStatus(id: number, status: string): Promise<Result<Appointment, AppError>> {
    return this.repo.updateStatus(id, status)
  }

  remove(id: number): Promise<Result<void, AppError>> {
    return this.repo.remove(id)
  }

  windowsOn(doctorId: number, date: string): Promise<Result<BookableWindow[], AppError>> {
    return this.repo.windowsOn(doctorId, date)
  }

  recordClinicBooking(
    input: RecordClinicBookingInput,
  ): Promise<Result<ClinicBookingResult, AppError>> {
    return this.repo.recordClinicBooking(input)
  }
}
