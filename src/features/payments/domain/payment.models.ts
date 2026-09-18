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
  /** The platform's share of this fee, as agreed when the booking was made.
   *  Null on a cancelled booking, which owes nothing, and on one taken before
   *  there was a share at all. */
  commissionRate: number | null
  commissionAmount: number | null
}

export interface PaymentSummary {
  collected: number
  outstanding: number
  refunded: number
  paidCount: number
  totalCount: number
  /** Charged on every booking that was not cancelled, collected or not: the
   *  share is earned by the booking, and collecting the fee is between the
   *  doctor and the patient. */
  commission: number
  net: number
  /** Bookings from before the platform had a share. Reported so the doctor can
   *  see the figures above do not silently include them. */
  unrated: number
  /** Patients whose first ever visit to this doctor falls inside the period.
   *
   *  The answer to what the commission bought. Every booking here came from
   *  the app -- the dashboard has had no way to enter one since the walk-in
   *  path was removed -- so these are people who would not otherwise have
   *  arrived. */
  newPatients: number
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
