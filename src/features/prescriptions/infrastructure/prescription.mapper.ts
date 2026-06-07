import type { Tables } from '@/core/types/database.types'
import type { Prescription, PrescriptionItem } from '../domain/prescription.models'

type PrescriptionRow = Tables<'prescriptions'> & {
  patients?: { full_name: string } | null
  prescription_items?: Tables<'prescription_items'>[] | null
}

export function toItem(row: Tables<'prescription_items'>): PrescriptionItem {
  return {
    id: row.id,
    prescriptionId: row.prescription_id,
    medicationName: row.medication_name,
    dosage: row.dosage,
    frequency: row.frequency,
    duration: row.duration,
    instructions: row.instructions,
  }
}

export function toPrescription(row: PrescriptionRow): Prescription {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    patientId: row.patient_id,
    patientName: row.patients?.full_name ?? null,
    consultationId: row.consultation_id,
    status: row.status,
    notes: row.notes,
    issuedAt: row.issued_at,
    items: (row.prescription_items ?? []).map(toItem),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
