import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { IAppointmentRepository } from '../domain/appointment.repository'
import type {
  Appointment,
  AppointmentListQuery,
  AppointmentListResult,
  AppointmentStatus,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '../domain/appointment.models'
import { startOfDayISO, endOfDayISO } from '@/shared/utils/datetime'

export class AppointmentService {
  constructor(private readonly repo: IAppointmentRepository) {}

  list(
    doctorId: string,
    query: AppointmentListQuery,
  ): Promise<Result<AppointmentListResult, AppError>> {
    return this.repo.list(doctorId, query)
  }

  listForDay(
    doctorId: string,
    date: Date,
    page = { from: 0, to: 100 },
  ): Promise<Result<AppointmentListResult, AppError>> {
    return this.repo.list(doctorId, {
      fromDate: startOfDayISO(date),
      toDate: endOfDayISO(date),
      ...page,
    })
  }

  getById(id: string): Promise<Result<Appointment, AppError>> {
    return this.repo.getById(id)
  }

  create(doctorId: string, input: CreateAppointmentInput): Promise<Result<Appointment, AppError>> {
    return this.repo.create(doctorId, input)
  }

  update(id: string, input: UpdateAppointmentInput): Promise<Result<Appointment, AppError>> {
    return this.repo.update(id, input)
  }

  setStatus(id: string, status: AppointmentStatus): Promise<Result<Appointment, AppError>> {
    return this.repo.updateStatus(id, status)
  }

  remove(id: string): Promise<Result<void, AppError>> {
    return this.repo.remove(id)
  }
}
