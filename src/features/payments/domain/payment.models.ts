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
  /** 'app' or 'clinic'. A clinic row carries no commission by design, not by
   *  accident, and the table says which it is looking at. */
  origin: string
  amount: number
  method: string | null
  status: PaymentStatus
  /** When the money was taken. Null while it is outstanding. */
  paidAt: string | null
  createdAt: string | null
  /** The platform's share of this fee, as agreed when the booking was made.
   *  Null on a cancelled booking, which owes nothing, and on one taken before
   *  there was a share at all. */
  commissionRate: number | null
  commissionAmount: number | null
}

export interface PaymentSummary {
  /** Fees taken for appointments that happened. */
  collected: number
  /** Fees taken for appointments that were cancelled or never attended. Kept
   *  apart from `collected` so the money in the drawer and the money the
   *  period earned are never added into one figure. */
  collectedOff: number
  outstanding: number
  refunded: number
  paidCount: number
  totalCount: number
  /** Appointments still waiting to be collected. Counted in the database, not
   *  as total minus paid, which reads a refund as money owed. */
  unpaidCount: number
  /** Charged on every booking that was not cancelled, collected or not: the
   *  share is earned by the booking, and collecting the fee is between the
   *  doctor and the patient. */
  commission: number
  net: number
  /** The fees the share was actually charged on. Lower than the total whenever
   *  the period contains bookings made before the commission existed, and the
   *  number the percentage has to be read against. */
  commissionable: number
  /** Bookings from before the platform had a share. Reported so the doctor can
   *  see the figures above do not silently include them. */
  unrated: number
  /** Visits the clinic took outside the app. The platform brought none of them
   *  and takes nothing from them, so they are stated rather than deducted. */
  clinicCount: number
  clinicFees: number
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
