import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { Patient } from './patient.models'

export interface IPatientRepository {
  /** Patients who have booked with the current doctor (optionally filtered). */
  listForDoctor(search?: string): Promise<Result<Patient[], AppError>>
  getById(id: string): Promise<Result<Patient, AppError>>
}
