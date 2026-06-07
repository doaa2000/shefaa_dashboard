import type { Tables, TablesInsert, TablesUpdate } from '@/core/types/database.types'
import type { CreatePatientInput, Patient, UpdatePatientInput } from '../domain/patient.models'

function emptyToNull(value: string | null | undefined): string | null {
  return value && value.length > 0 ? value : null
}

export function toPatient(row: Tables<'patients'>): Patient {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    bloodType: row.blood_type,
    address: row.address,
    medicalHistory: row.medical_history,
    allergies: row.allergies,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toInsert(doctorId: string, input: CreatePatientInput): TablesInsert<'patients'> {
  return {
    doctor_id: doctorId,
    full_name: input.fullName,
    email: emptyToNull(input.email),
    phone: emptyToNull(input.phone),
    date_of_birth: emptyToNull(input.dateOfBirth),
    gender: input.gender,
    blood_type: emptyToNull(input.bloodType),
    address: emptyToNull(input.address),
    medical_history: emptyToNull(input.medicalHistory),
    allergies: input.allergies ?? [],
    is_active: input.isActive ?? true,
  }
}

export function toUpdate(input: UpdatePatientInput): TablesUpdate<'patients'> {
  const patch: TablesUpdate<'patients'> = {}
  if (input.fullName !== undefined) patch.full_name = input.fullName
  if (input.email !== undefined) patch.email = emptyToNull(input.email)
  if (input.phone !== undefined) patch.phone = emptyToNull(input.phone)
  if (input.dateOfBirth !== undefined) patch.date_of_birth = emptyToNull(input.dateOfBirth)
  if (input.gender !== undefined) patch.gender = input.gender
  if (input.bloodType !== undefined) patch.blood_type = emptyToNull(input.bloodType)
  if (input.address !== undefined) patch.address = emptyToNull(input.address)
  if (input.medicalHistory !== undefined) patch.medical_history = emptyToNull(input.medicalHistory)
  if (input.allergies !== undefined) patch.allergies = input.allergies
  if (input.isActive !== undefined) patch.is_active = input.isActive
  return patch
}
