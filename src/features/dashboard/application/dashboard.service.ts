import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { IDashboardRepository } from '../domain/dashboard.repository'
import type { DashboardSummary } from '../domain/dashboard.models'

export class DashboardService {
  constructor(private readonly repo: IDashboardRepository) {}

  getSummary(): Promise<Result<DashboardSummary, AppError>> {
    return this.repo.getSummary()
  }
}
