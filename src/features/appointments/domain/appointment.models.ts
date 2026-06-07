import type { AppointmentStatus, AppointmentType } from '@/core/types/database.types'

export type { AppointmentStatus, AppointmentType }

export interface Appointment {
  id: string
  doctorId: string
  patientId: string
  patientName: string | null
  scheduledAt: string
  durationMinutes: number
  type: AppointmentType
  status: AppointmentStatus
  reason: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface AppointmentListQuery {
  search?: string
  status?: AppointmentStatus
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
  scheduledAt: string
  durationMinutes: number
  type: AppointmentType
  reason: string | null
  notes: string | null
}

export type UpdateAppointmentInput = Partial<CreateAppointmentInput> & {
  status?: AppointmentStatus
}
