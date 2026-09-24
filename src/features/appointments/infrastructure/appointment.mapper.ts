import type { Tables, TablesUpdate } from '@/core/types/database.types'
import type { Appointment, UpdateAppointmentInput } from '../domain/appointment.models'

type BookingRow = Tables<'bookings'> & { profiles?: { name: string | null } | null }

export function toAppointment(row: BookingRow): Appointment {
  return {
    id: row.id,
    patientId: row.patient_id,
    // The profile's name first. A clinic booking that turned out to belong to
    // somebody with an account carries both, and the account's name is the one
    // the patient chose for themselves.
    patientName: row.profiles?.name ?? row.walk_in_name ?? null,
    doctorId: row.doctor_id,
    // Rows written before the clinic could enter one have no origin column
    // value to read only if the migration has not run; the default is 'app'
    // and matches what every one of them is.
    origin: row.origin ?? 'app',
    walkInName: row.walk_in_name ?? null,
    walkInPhone: row.walk_in_phone ?? null,
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
