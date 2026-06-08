import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { IPrescriptionRepository } from '../domain/prescription.repository'
import type {
  CreatePrescriptionInput,
  Prescription,
  PrescriptionListQuery,
  PrescriptionListResult,
  UpdatePrescriptionInput,
} from '../domain/prescription.models'

export class PrescriptionService {
  constructor(private readonly repo: IPrescriptionRepository) {}

  list(
    doctorId: number,
    query: PrescriptionListQuery,
  ): Promise<Result<PrescriptionListResult, AppError>> {
    return this.repo.list(doctorId, query)
  }

  getById(id: string): Promise<Result<Prescription, AppError>> {
    return this.repo.getById(id)
  }

  create(
    doctorId: number,
    input: CreatePrescriptionInput,
  ): Promise<Result<Prescription, AppError>> {
    return this.repo.create(doctorId, input)
  }

  update(id: string, input: UpdatePrescriptionInput): Promise<Result<Prescription, AppError>> {
    return this.repo.update(id, input)
  }

  remove(id: string): Promise<Result<void, AppError>> {
    return this.repo.remove(id)
  }
}
