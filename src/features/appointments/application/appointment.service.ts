import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { IAppointmentRepository } from '../domain/appointment.repository'
import type {
  Appointment,
  AppointmentListQuery,
  AppointmentListResult,
  CreateAppointmentInput,
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

  listQueue(doctorId: number, date: string): Promise<Result<Appointment[], AppError>> {
    return this.repo.listQueue(doctorId, date)
  }

  getById(id: number): Promise<Result<Appointment, AppError>> {
    return this.repo.getById(id)
  }

  create(doctorId: number, input: CreateAppointmentInput): Promise<Result<Appointment, AppError>> {
    return this.repo.create(doctorId, input)
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
}
