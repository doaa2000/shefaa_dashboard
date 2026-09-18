import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { Tables } from '@/core/types/database.types'
import type { IInvoiceRepository } from '../domain/invoice.repository'
import type { CommissionInvoice, InvoiceStatus } from '../domain/invoice.models'

function toInvoice(row: Tables<'commission_invoices'>): CommissionInvoice {
  return {
    id: row.id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    bookings: row.bookings,
    // numeric arrives as a string over the wire, so every amount is converted
    // once here rather than wherever it happens to be added up.
    fees: Number(row.fees ?? 0),
    commission: Number(row.commission ?? 0),
    status: row.status as InvoiceStatus,
    issuedAt: row.issued_at,
    paidAt: row.paid_at,
    paidNote: row.paid_note,
    voidReason: row.void_reason,
  }
}

export class SupabaseInvoiceRepository implements IInvoiceRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  /**
   * No filter by doctor. The table's policy already answers with this
   * doctor's invoices and nothing else, and a filter written here as well
   * would be a second copy of that rule, free to drift from it.
   */
  async list(): Promise<Result<CommissionInvoice[], AppError>> {
    try {
      const { data, error } = await this.client
        .from('commission_invoices')
        .select('*')
        .order('period_start', { ascending: false })
      if (error) return err(normalizeError(error))
      return ok(data.map(toInvoice))
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
