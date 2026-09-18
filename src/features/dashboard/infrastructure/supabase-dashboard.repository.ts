import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { IDashboardRepository } from '../domain/dashboard.repository'
import type { DashboardSummary } from '../domain/dashboard.models'

interface SummaryRow {
  total_patients: number
  new_patients_this_month: number
  appointments_today: number
  appointments_upcoming: number
  unread_notifications: number
  revenue_this_month: number
}

export class SupabaseDashboardRepository implements IDashboardRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async getSummary(): Promise<Result<DashboardSummary, AppError>> {
    try {
      const { data, error } = await this.client.rpc('dashboard_summary')
      if (error) return err(normalizeError(error))
      const row = data as unknown as SummaryRow
      return ok({
        totalPatients: row.total_patients,
        newPatientsThisMonth: row.new_patients_this_month,
        appointmentsToday: row.appointments_today,
        appointmentsUpcoming: row.appointments_upcoming,
        unreadNotifications: row.unread_notifications,
        revenueThisMonth: Number(row.revenue_this_month ?? 0),
      })
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
