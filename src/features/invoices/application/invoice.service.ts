import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { IInvoiceRepository } from '../domain/invoice.repository'
import type { CommissionInvoice } from '../domain/invoice.models'

export class InvoiceService {
  constructor(private readonly repo: IInvoiceRepository) {}

  list(): Promise<Result<CommissionInvoice[], AppError>> {
    return this.repo.list()
  }
}
