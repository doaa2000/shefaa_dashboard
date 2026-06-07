import type { ConsultationStatus } from '@/core/types/database.types'

export type { ConsultationStatus }

export interface Vitals {
  bloodPressure?: string
  heartRate?: string
  temperature?: string
  weight?: string
  height?: string
  [key: string]: string | undefined
}

export interface Consultation {
  id: string
  doctorId: string
  patientId: string
  patientName: string | null
  appointmentId: string | null
  chiefComplaint: string | null
  diagnosis: string | null
  symptoms: string[]
  clinicalNotes: string | null
  vitals: Vitals
  status: ConsultationStatus
  consultedAt: string
  createdAt: string
  updatedAt: string
}

export interface ConsultationListQuery {
  patientId?: string
  status?: ConsultationStatus
  from: number
  to: number
}

export interface ConsultationListResult {
  items: Consultation[]
  total: number
}

export interface CreateConsultationInput {
  patientId: string
  appointmentId: string | null
  chiefComplaint: string | null
  diagnosis: string | null
  symptoms: string[]
  clinicalNotes: string | null
  vitals: Vitals
  status: ConsultationStatus
  consultedAt: string
}

export type UpdateConsultationInput = Partial<CreateConsultationInput>
