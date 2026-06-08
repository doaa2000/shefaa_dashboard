import type { Tables } from '@/core/types/database.types'
import type { Patient } from '../domain/patient.models'

export function toPatient(row: Tables<'profiles'>): Patient {
  return {
    id: row.id,
    name: row.name ?? 'Unknown patient',
    phone: row.phone,
    gender: row.gender,
    birthDate: row.birth_date,
  }
}
