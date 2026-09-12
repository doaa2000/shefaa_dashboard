import type { Tables, TablesInsert, TablesUpdate } from '@/core/types/database.types'
import type {
  Appointment,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '../domain/appointment.models'

type BookingRow = Tables<'bookings'> & { profiles?: { name: string | null } | null }

export function toAppointment(row: BookingRow): Appointment {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.profiles?.name ?? null,
    doctorId: row.doctor_id,
    paymentId: row.payment_id,
    bookedDate: row.booked_date,
    // Rows written before the queue model carry no session; they were all
    // morning-window bookings, so that is the honest default.
    session: row.session ?? 'morning',
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status ?? 'pending',
    createdAt: row.created_at,
  }
}

export function toInsert(doctorId: number, input: CreateAppointmentInput): TablesInsert<'bookings'> {
  return {
    doctor_id: doctorId,
    patient_id: input.patientId,
    booked_date: input.bookedDate,
    session: input.session,
    start_time: input.startTime,
    end_time: input.endTime,
    status: input.status,
  }
}

export function toUpdate(input: UpdateAppointmentInput): TablesUpdate<'bookings'> {
  const patch: TablesUpdate<'bookings'> = {}
  if (input.patientId !== undefined) patch.patient_id = input.patientId
  if (input.bookedDate !== undefined) patch.booked_date = input.bookedDate
  if (input.session !== undefined) patch.session = input.session
  if (input.startTime !== undefined) patch.start_time = input.startTime
  if (input.endTime !== undefined) patch.end_time = input.endTime
  if (input.status !== undefined) patch.status = input.status
  return patch
}
