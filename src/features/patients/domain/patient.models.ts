import type { GenderType } from '@/core/types/database.types'

export type Gender = GenderType

export interface Patient {
  id: string
  doctorId: string
  fullName: string
  email: string | null
  phone: string | null
  dateOfBirth: string | null
  gender: Gender
  bloodType: string | null
  address: string | null
  medicalHistory: string | null
  allergies: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PatientListQuery {
  search?: string
  isActive?: boolean
  from: number
  to: number
}

export interface PatientListResult {
  items: Patient[]
  total: number
}

export type CreatePatientInput = Omit<
  Patient,
  'id' | 'doctorId' | 'createdAt' | 'updatedAt' | 'isActive'
> & { isActive?: boolean }

export type UpdatePatientInput = Partial<CreatePatientInput>
