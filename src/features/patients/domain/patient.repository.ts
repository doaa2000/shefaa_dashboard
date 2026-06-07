import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type {
  CreatePatientInput,
  Patient,
  PatientListQuery,
  PatientListResult,
  UpdatePatientInput,
} from './patient.models'

export interface IPatientRepository {
  list(doctorId: string, query: PatientListQuery): Promise<Result<PatientListResult, AppError>>
  getById(id: string): Promise<Result<Patient, AppError>>
  create(doctorId: string, input: CreatePatientInput): Promise<Result<Patient, AppError>>
  update(id: string, input: UpdatePatientInput): Promise<Result<Patient, AppError>>
  remove(id: string): Promise<Result<void, AppError>>
}
