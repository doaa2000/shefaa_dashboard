import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { IReportRepository } from '../domain/report.repository'
import type { AppointmentsTrend } from '../domain/report.models'

export class SupabaseReportRepository implements IReportRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async appointmentsTrend(days: number): Promise<Result<AppointmentsTrend, AppError>> {
    try {
      const { data, error } = await this.client.rpc('appointments_trend', { days })
      if (error) return err(normalizeError(error))
      const points = (data ?? []).map((row) => ({ day: row.day, total: Number(row.total) }))
      const totalInPeriod = points.reduce((sum, p) => sum + p.total, 0)
      return ok({ points, totalInPeriod })
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
