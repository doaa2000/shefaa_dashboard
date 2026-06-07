import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { IPatientRepository } from '../domain/patient.repository'
import type {
  CreatePatientInput,
  Patient,
  PatientListQuery,
  PatientListResult,
  UpdatePatientInput,
} from '../domain/patient.models'

export class PatientService {
  constructor(private readonly repo: IPatientRepository) {}

  list(doctorId: string, query: PatientListQuery): Promise<Result<PatientListResult, AppError>> {
    return this.repo.list(doctorId, query)
  }

  getById(id: string): Promise<Result<Patient, AppError>> {
    return this.repo.getById(id)
  }

  create(doctorId: string, input: CreatePatientInput): Promise<Result<Patient, AppError>> {
    return this.repo.create(doctorId, input)
  }

  update(id: string, input: UpdatePatientInput): Promise<Result<Patient, AppError>> {
    return this.repo.update(id, input)
  }

  remove(id: string): Promise<Result<void, AppError>> {
    return this.repo.remove(id)
  }
}
