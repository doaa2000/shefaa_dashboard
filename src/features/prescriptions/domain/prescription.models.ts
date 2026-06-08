export type PrescriptionStatus = 'active' | 'completed' | 'cancelled'

export interface PrescriptionItem {
  id: string
  prescriptionId: string
  medicationName: string
  dosage: string | null
  frequency: string | null
  duration: string | null
  instructions: string | null
}

export interface Prescription {
  id: string
  doctorId: number
  patientId: string
  patientName: string | null
  consultationId: string | null
  status: PrescriptionStatus
  notes: string | null
  issuedAt: string
  items: PrescriptionItem[]
  createdAt: string
  updatedAt: string
}

export interface PrescriptionListQuery {
  patientId?: string
  status?: PrescriptionStatus
  from: number
  to: number
}

export interface PrescriptionListResult {
  items: Prescription[]
  total: number
}

export interface PrescriptionItemInput {
  medicationName: string
  dosage: string | null
  frequency: string | null
  duration: string | null
  instructions: string | null
}

export interface CreatePrescriptionInput {
  patientId: string
  consultationId: string | null
  status: PrescriptionStatus
  notes: string | null
  issuedAt: string
  items: PrescriptionItemInput[]
}

export type UpdatePrescriptionInput = Partial<CreatePrescriptionInput>
