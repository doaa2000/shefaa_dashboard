import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { DateRange, PaymentsPage, SettableStatus } from './payment.models'

export interface IPaymentRepository {
  /** Everything the page shows, for one date range, in one call. */
  listForRange(range: DateRange): Promise<Result<PaymentsPage, AppError>>

  /** Marks one payment collected, refunded, or outstanding again. */
  setStatus(paymentId: number, status: SettableStatus): Promise<Result<void, AppError>>
}
