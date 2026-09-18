/** issued: raised and not yet settled. paid: settled. void: withdrawn, and
 *  kept, because "this was withdrawn and why" is the question asked later. */
export type InvoiceStatus = 'issued' | 'paid' | 'void'

export interface CommissionInvoice {
  id: number
  periodStart: string
  periodEnd: string
  /** Frozen when the invoice was raised. The live figures move with
   *  corrections; an invoice that changed after it was sent is not an
   *  invoice. */
  bookings: number
  fees: number
  commission: number
  status: InvoiceStatus
  issuedAt: string
  paidAt: string | null
  /** How it was settled, in the owner's words: a transfer reference, "cash at
   *  the clinic". Shown to the doctor because it is the receipt. */
  paidNote: string | null
  voidReason: string | null
}

export function isOutstanding(invoice: CommissionInvoice): boolean {
  return invoice.status === 'issued'
}

/**
 * Whether the period is exactly one calendar month.
 *
 * Most of them are, and "March 2026" reads better than "01 Mar – 31 Mar". A
 * doctor who joined mid-month gets a part period, and that one has to show its
 * two dates or it would claim to be a month it is not.
 */
export function coversWholeMonth(periodStart: string, periodEnd: string): boolean {
  const start = new Date(`${periodStart}T00:00:00`)
  const end = new Date(`${periodEnd}T00:00:00`)
  if (start.getDate() !== 1) return false
  if (start.getFullYear() !== end.getFullYear() || start.getMonth() !== end.getMonth()) return false
  const lastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()
  return end.getDate() === lastDay
}
