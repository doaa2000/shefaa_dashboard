/** An appointment is a row in the `bookings` table. */
export interface Appointment {
  id: number
  /** Null for a patient the clinic entered who has no account, and for one
   *  whose account has since been deleted. */
  patientId: string | null
  patientName: string | null
  doctorId: number
  /** 'app' when the patient booked it themselves, 'clinic' when the doctor
   *  entered it for somebody who reached them another way. The second earns
   *  the platform no commission. */
  origin: string
  /** What the clinic wrote down, when they were the ones writing. */
  walkInName: string | null
  walkInPhone: string | null
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

/** What an appointment can be changed to. There is no create shape: bookings
 *  are made in the patients' app, and the dashboard only manages what is
 *  already there. The fee is not here either -- it lives on the payment row,
 *  and changing money belongs on the payments page, where the change is
 *  recorded against whoever made it. */
export interface UpdateAppointmentInput {
  patientId?: string
  bookedDate?: string
  session?: string
  startTime?: string
  endTime?: string
  status?: string
}

/**
 * One window the doctor is offering on a given date, and how full it is.
 *
 * Read from the schedule rather than typed in, so the clinic picks from what
 * the doctor actually holds that day. A window assembled by hand is refused by
 * the database, and being refused after filling in a form is a worse way to
 * learn that than not being offered it.
 */
export interface BookableWindow {
  session: string
  startTime: string
  endTime: string
  capacity: number
  booked: number
  remaining: number
  /** Whether the window's hour has already come round. The clinic books into
   *  these deliberately -- they are writing down who was seen. */
  hasStarted: boolean
}

/** A booking the clinic takes outside the app: the telephone call, the person
 *  at the desk. No patient id, because usually there is no account. */
export interface RecordClinicBookingInput {
  name: string
  phone?: string
  bookedDate: string
  session: string
  startTime: string
  endTime: string
  /** Null means the doctor's usual fee. Zero is a decision and is kept. */
  amount?: number | null
  paid: boolean
  method: string
}

/** What the clinic is owed to know after recording one. */
export interface ClinicBookingResult {
  bookingId: number
  /** True when the telephone number matched exactly one account, so this visit
   *  joins that patient's history instead of standing alone. */
  linked: boolean
  amount: number
  capacity: number | null
  /** How full the window was before this booking went into it. */
  booked: number
  /** The session was already at its limit. Recorded anyway -- see the
   *  migration; the clinic can see the waiting room and the database cannot. */
  overCapacity: boolean
}
