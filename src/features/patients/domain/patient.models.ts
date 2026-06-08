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
