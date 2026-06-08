import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { IPaymentRepository } from '../domain/payment.repository'
import type { Payment, PaymentListResult } from '../domain/payment.models'

interface BookingPaymentRow {
  id: number
  booked_date: string
  profiles: { name: string | null } | null
  payments: {
    id: number
    amount: number
    payment_method: string | null
    status: string | null
    created_at: string | null
  } | null
}

export class SupabasePaymentRepository implements IPaymentRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async listForDoctor(doctorId: number): Promise<Result<PaymentListResult, AppError>> {
    try {
      const { data, error } = await this.client
        .from('bookings')
        .select('id, booked_date, profiles(name), payments(id, amount, payment_method, status, created_at)')
        .eq('doctor_id', doctorId)
        .not('payment_id', 'is', null)
        .order('booked_date', { ascending: false })
      if (error) return err(normalizeError(error))

      const rows = (data as unknown as BookingPaymentRow[]) ?? []
      const items: Payment[] = rows
        .filter((r) => r.payments !== null)
        .map((r) => ({
          id: r.payments!.id,
          bookingId: r.id,
          bookedDate: r.booked_date,
          patientName: r.profiles?.name ?? null,
          amount: Number(r.payments!.amount),
          method: r.payments!.payment_method,
          status: r.payments!.status,
          createdAt: r.payments!.created_at,
        }))

      const totalAmount = items.reduce((sum, p) => sum + p.amount, 0)
      return ok({ items, total: items.length, totalAmount })
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
