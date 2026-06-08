/** An appointment is a row in the `bookings` table. */
export interface Appointment {
  id: number
  patientId: string
  patientName: string | null
  doctorId: number
  paymentId: number | null
  bookedDate: string
  startTime: string
  endTime: string
  status: string
  createdAt: string | null
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
  startTime: string
  endTime: string
  status: string
}

export type UpdateAppointmentInput = Partial<CreateAppointmentInput>
