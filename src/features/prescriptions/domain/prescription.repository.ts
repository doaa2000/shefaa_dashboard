import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type {
  CreatePrescriptionInput,
  Prescription,
  PrescriptionListQuery,
  PrescriptionListResult,
  UpdatePrescriptionInput,
} from './prescription.models'

export interface IPrescriptionRepository {
  list(
    doctorId: number,
    query: PrescriptionListQuery,
  ): Promise<Result<PrescriptionListResult, AppError>>
  getById(id: string): Promise<Result<Prescription, AppError>>
  create(doctorId: number, input: CreatePrescriptionInput): Promise<Result<Prescription, AppError>>
  update(id: string, input: UpdatePrescriptionInput): Promise<Result<Prescription, AppError>>
  remove(id: string): Promise<Result<void, AppError>>
}
