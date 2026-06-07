import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { DashboardSummary } from './dashboard.models'

export interface IDashboardRepository {
  getSummary(): Promise<Result<DashboardSummary, AppError>>
}
