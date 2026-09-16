import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { IPatientRepository } from '../domain/patient.repository'
import type { Patient, PatientHistory } from '../domain/patient.models'

export class PatientService {
  constructor(private readonly repo: IPatientRepository) {}

  listForDoctor(search?: string): Promise<Result<Patient[], AppError>> {
    return this.repo.listForDoctor(search)
  }

  getById(id: string): Promise<Result<Patient, AppError>> {
    return this.repo.getById(id)
  }

  getHistory(id: string): Promise<Result<PatientHistory, AppError>> {
    return this.repo.getHistory(id)
  }
}
