import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { IPaymentRepository } from '../domain/payment.repository'
import type { PaymentListResult } from '../domain/payment.models'

export class PaymentService {
  constructor(private readonly repo: IPaymentRepository) {}

  listForDoctor(doctorId: number): Promise<Result<PaymentListResult, AppError>> {
    return this.repo.listForDoctor(doctorId)
  }
}
