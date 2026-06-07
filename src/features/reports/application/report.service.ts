import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { IReportRepository } from '../domain/report.repository'
import type { AppointmentsTrend } from '../domain/report.models'

export class ReportService {
  constructor(private readonly repo: IReportRepository) {}

  appointmentsTrend(days = 30): Promise<Result<AppointmentsTrend, AppError>> {
    return this.repo.appointmentsTrend(days)
  }
}
