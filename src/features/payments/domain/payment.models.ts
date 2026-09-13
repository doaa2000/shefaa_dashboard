export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed'

/** The three the dashboard may set. 'failed' means a gateway declined, and
 *  there is no gateway: money that was not handed over is still pending. */
export type SettableStatus = Extract<PaymentStatus, 'pending' | 'paid' | 'refunded'>

export interface DateRange {
  /** Inclusive, as YYYY-MM-DD in the clinic's own day, not UTC. */
  from: string
  to: string
}

export interface Payment {
  id: number
  bookingId: number
  bookedDate: string
  session: string | null
  startTime: string | null
  endTime: string | null
  bookingStatus: string | null
  patientName: string | null
  amount: number
  method: string | null
  status: PaymentStatus
  /** When the money was taken. Null while it is outstanding. */
  paidAt: string | null
  createdAt: string | null
}

export interface PaymentSummary {
  collected: number
  outstanding: number
  refunded: number
  paidCount: number
  totalCount: number
}

/** Cash is in the drawer and instapay is in the bank; they are counted apart
 *  because they are reconciled apart. */
export interface MethodTotals {
  method: string
  collected: number
  outstanding: number
  count: number
}

export interface PaymentsPage {
  range: DateRange
  summary: PaymentSummary
  byMethod: MethodTotals[]
  items: Payment[]
}
