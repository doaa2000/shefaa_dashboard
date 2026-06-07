import type { Tables, TablesInsert, TablesUpdate } from '@/core/types/database.types'
import type {
  Appointment,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '../domain/appointment.models'

/** Row shape when joined with the patient name. */
type AppointmentRowWithPatient = Tables<'appointments'> & {
  patients?: { full_name: string } | null
}

function emptyToNull(value: string | null | undefined): string | null {
  return value && value.length > 0 ? value : null
}

export function toAppointment(row: AppointmentRowWithPatient): Appointment {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    patientId: row.patient_id,
    patientName: row.patients?.full_name ?? null,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    type: row.type,
    status: row.status,
    reason: row.reason,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toInsert(
  doctorId: string,
  input: CreateAppointmentInput,
): TablesInsert<'appointments'> {
  return {
    doctor_id: doctorId,
    patient_id: input.patientId,
    scheduled_at: input.scheduledAt,
    duration_minutes: input.durationMinutes,
    type: input.type,
    reason: emptyToNull(input.reason),
    notes: emptyToNull(input.notes),
  }
}

export function toUpdate(input: UpdateAppointmentInput): TablesUpdate<'appointments'> {
  const patch: TablesUpdate<'appointments'> = {}
  if (input.patientId !== undefined) patch.patient_id = input.patientId
  if (input.scheduledAt !== undefined) patch.scheduled_at = input.scheduledAt
  if (input.durationMinutes !== undefined) patch.duration_minutes = input.durationMinutes
  if (input.type !== undefined) patch.type = input.type
  if (input.reason !== undefined) patch.reason = emptyToNull(input.reason)
  if (input.notes !== undefined) patch.notes = emptyToNull(input.notes)
  if (input.status !== undefined) patch.status = input.status
  return patch
}
