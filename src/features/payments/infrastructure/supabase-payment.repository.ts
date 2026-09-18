import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { IPaymentRepository } from '../domain/payment.repository'
import type {
  DateRange,
  MethodTotals,
  Payment,
  PaymentsPage,
  SettableStatus,
} from '../domain/payment.models'

/**
 * Payments are read through doctor_payments, not from the table.
 *
 * The policy on payments is "the patient who owns it, or an administrator", so
 * a doctor selecting from it gets nothing back -- which is exactly what this
 * page used to show. doctor_payments is a definer function scoped to the
 * signed-in doctor, and it returns the figures and the rows together so the
 * totals cannot disagree with the list under them.
 */
export class SupabasePaymentRepository implements IPaymentRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async listForRange(range: DateRange): Promise<Result<PaymentsPage, AppError>> {
    try {
      const { data, error } = await this.client.rpc('doctor_payments', {
        p_from: range.from,
        p_to: range.to,
      })
      if (error) return err(normalizeError(error))

      const raw = (data ?? {}) as Partial<PaymentsPage>
      const summary = raw.summary

      return ok({
        range: raw.range ?? range,
        summary: {
          collected: Number(summary?.collected ?? 0),
          collectedOff: Number(summary?.collectedOff ?? 0),
          outstanding: Number(summary?.outstanding ?? 0),
          refunded: Number(summary?.refunded ?? 0),
          paidCount: Number(summary?.paidCount ?? 0),
          totalCount: Number(summary?.totalCount ?? 0),
          unpaidCount: Number(summary?.unpaidCount ?? 0),
          commission: Number(summary?.commission ?? 0),
          net: Number(summary?.net ?? 0),
          commissionable: Number(summary?.commissionable ?? 0),
          unrated: Number(summary?.unrated ?? 0),
        },
        byMethod: (raw.byMethod ?? []).map(
          (m): MethodTotals => ({
            method: m.method,
            collected: Number(m.collected ?? 0),
            outstanding: Number(m.outstanding ?? 0),
            count: Number(m.count ?? 0),
          }),
        ),
        // numeric comes back as a string over the wire, so every amount is
        // converted once here rather than wherever it happens to be added up.
        items: (raw.items ?? []).map(
          (p): Payment => ({
            ...p,
            amount: Number(p.amount ?? 0),
            commissionRate: p.commissionRate == null ? null : Number(p.commissionRate),
            commissionAmount:
              p.commissionAmount == null ? null : Number(p.commissionAmount),
          }),
        ),
      })
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async setStatus(
    paymentId: number,
    status: SettableStatus,
  ): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client.rpc('set_payment_status', {
        p_payment: paymentId,
        p_status: status,
      })
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
