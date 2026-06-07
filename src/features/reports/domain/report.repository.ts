import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { AppointmentsTrend } from './report.models'

export interface IReportRepository {
  appointmentsTrend(days: number): Promise<Result<AppointmentsTrend, AppError>>
}
