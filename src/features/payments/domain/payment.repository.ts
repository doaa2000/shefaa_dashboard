import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { PaymentListResult } from './payment.models'

export interface IPaymentRepository {
  listForDoctor(doctorId: number): Promise<Result<PaymentListResult, AppError>>
}
