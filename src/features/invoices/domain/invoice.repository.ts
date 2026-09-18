import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { CommissionInvoice } from './invoice.models'

/**
 * Read only, deliberately.
 *
 * Raising, settling and withdrawing an invoice are the owner's, through
 * functions that refuse anybody else. A doctor's whole relationship with this
 * table is being able to see what was claimed from them.
 */
export interface IInvoiceRepository {
  list(): Promise<Result<CommissionInvoice[], AppError>>
}
