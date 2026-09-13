import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { IPaymentRepository } from '../domain/payment.repository'
import type { DateRange, PaymentsPage, SettableStatus } from '../domain/payment.models'

export class PaymentService {
  constructor(private readonly repo: IPaymentRepository) {}

  listForRange(range: DateRange): Promise<Result<PaymentsPage, AppError>> {
    return this.repo.listForRange(range)
  }

  setStatus(paymentId: number, status: SettableStatus): Promise<Result<void, AppError>> {
    return this.repo.setStatus(paymentId, status)
  }
}
