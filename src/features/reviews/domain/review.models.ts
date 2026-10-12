/** One patient's rating of one visit, as the doctor sees it: the note
 *  included. Other patients see the stars and nothing else. */
export interface DoctorReview {
  id: number
  stars: number
  /** Null when the patient left stars alone, which most do. */
  comment: string | null
  createdAt: string
  /** The patient's name, or null when it could not be read. */
  patientName: string | null
}
