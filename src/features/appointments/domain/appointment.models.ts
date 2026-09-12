/** An appointment is a row in the `bookings` table. */
export interface Appointment {
  id: number
  patientId: string
  patientName: string | null
  doctorId: number
  paymentId: number | null
  bookedDate: string
  /** 'morning' or 'evening'. Patients queue within a session, not a slot. */
  session: string
  startTime: string
  endTime: string
  status: string
  createdAt: string | null
}

/** An appointment with the place it holds in its session's queue. */
export interface QueueEntry extends Appointment {
  /**
   * Position in this window's list, for the doctor's own reading only.
   *
   * The patient is never shown a number: the clinic sees people in the order
   * they walk in, and most of them never booked through the app, so no
   * position computed from bookings would describe the room.
   */
  position: number
}

/**
 * One bookable window of a day, split into who is left and who is done.
 *
 * A session the doctor left whole is a single window from its start to its
 * end; one with an appointment length set is several.
 */
export interface SessionQueue {
  session: string
  /** The window, e.g. "09:00" - "10:00". */
  startTime: string
  endTime: string
  entries: QueueEntry[]
  /** The patient being seen now: the first one not yet dealt with. */
  current: QueueEntry | null
  waiting: QueueEntry[]
  done: QueueEntry[]
}

export interface AppointmentListQuery {
  status?: string
  fromDate?: string
  toDate?: string
  from: number
  to: number
}

export interface AppointmentListResult {
  items: Appointment[]
  total: number
}

export interface CreateAppointmentInput {
  patientId: string
  bookedDate: string
  session: string
  startTime: string
  endTime: string
  status: string
}

export type UpdateAppointmentInput = Partial<CreateAppointmentInput>
