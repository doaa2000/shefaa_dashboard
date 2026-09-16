import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { Patient, PatientHistory } from './patient.models'

export interface IPatientRepository {
  /** Patients who have booked with the current doctor (optionally filtered). */
  listForDoctor(search?: string): Promise<Result<Patient[], AppError>>
  getById(id: string): Promise<Result<Patient, AppError>>

  /** This patient's appointments with the current doctor, and nobody else's
   *  clinic. What they did elsewhere is not this doctor's business. */
  getHistory(id: string): Promise<Result<PatientHistory, AppError>>
}
