import type { Tables, TablesInsert, TablesUpdate } from '@/core/types/database.types'
import type {
  Consultation,
  CreateConsultationInput,
  UpdateConsultationInput,
  Vitals,
} from '../domain/consultation.models'

type ConsultationRow = Tables<'consultations'> & { patients?: { full_name: string } | null }

function emptyToNull(value: string | null | undefined): string | null {
  return value && value.length > 0 ? value : null
}

export function toConsultation(row: ConsultationRow): Consultation {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    patientId: row.patient_id,
    patientName: row.patients?.full_name ?? null,
    appointmentId: row.appointment_id,
    chiefComplaint: row.chief_complaint,
    diagnosis: row.diagnosis,
    symptoms: row.symptoms,
    clinicalNotes: row.clinical_notes,
    vitals: (row.vitals as Vitals) ?? {},
    status: row.status,
    consultedAt: row.consulted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toInsert(
  doctorId: string,
  input: CreateConsultationInput,
): TablesInsert<'consultations'> {
  return {
    doctor_id: doctorId,
    patient_id: input.patientId,
    appointment_id: input.appointmentId,
    chief_complaint: emptyToNull(input.chiefComplaint),
    diagnosis: emptyToNull(input.diagnosis),
    symptoms: input.symptoms,
    clinical_notes: emptyToNull(input.clinicalNotes),
    vitals: input.vitals,
    status: input.status,
    consulted_at: input.consultedAt,
  }
}

export function toUpdate(input: UpdateConsultationInput): TablesUpdate<'consultations'> {
  const patch: TablesUpdate<'consultations'> = {}
  if (input.patientId !== undefined) patch.patient_id = input.patientId
  if (input.appointmentId !== undefined) patch.appointment_id = input.appointmentId
  if (input.chiefComplaint !== undefined) patch.chief_complaint = emptyToNull(input.chiefComplaint)
  if (input.diagnosis !== undefined) patch.diagnosis = emptyToNull(input.diagnosis)
  if (input.symptoms !== undefined) patch.symptoms = input.symptoms
  if (input.clinicalNotes !== undefined) patch.clinical_notes = emptyToNull(input.clinicalNotes)
  if (input.vitals !== undefined) patch.vitals = input.vitals
  if (input.status !== undefined) patch.status = input.status
  if (input.consultedAt !== undefined) patch.consulted_at = input.consultedAt
  return patch
}
