/**
 * In the Shefaa schema a "patient" is a row in `profiles` (an app user who
 * books appointments). The doctor dashboard treats patients as read-only —
 * patients own their own accounts.
 */
export interface Patient {
  id: string
  name: string
  phone: string | null
  gender: string | null
  birthDate: string | null
}

export interface PatientListResult {
  items: Patient[]
  total: number
}

/** One appointment this patient had with the doctor reading the page. */
export interface PatientVisit {
  id: number
  bookedDate: string
  session: string
  startTime: string
  endTime: string
  status: string
  createdAt: string | null
  amount: number | null
  paymentMethod: string | null
  paymentStatus: string | null
}

export interface PatientVisitSummary {
  /** Bookings that were not cancelled. A cancelled one is not a visit: calling
   *  it one would tell the doctor they have seen somebody they never met. */
  visits: number
  attended: number
  noShow: number
  cancelled: number
  fees: number
  firstVisit: string | null
  lastVisit: string | null
}

export interface PatientHistory {
  summary: PatientVisitSummary
  items: PatientVisit[]
}
