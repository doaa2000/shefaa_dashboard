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
  queueNumber: number
}

/** One session's queue for a day, split into who is left and who is done. */
export interface SessionQueue {
  session: string
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
