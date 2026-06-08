import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type {
  Consultation,
  ConsultationListQuery,
  ConsultationListResult,
  CreateConsultationInput,
  UpdateConsultationInput,
} from './consultation.models'

export interface IConsultationRepository {
  list(
    doctorId: number,
    query: ConsultationListQuery,
  ): Promise<Result<ConsultationListResult, AppError>>
  getById(id: string): Promise<Result<Consultation, AppError>>
  create(doctorId: number, input: CreateConsultationInput): Promise<Result<Consultation, AppError>>
  update(id: string, input: UpdateConsultationInput): Promise<Result<Consultation, AppError>>
  remove(id: string): Promise<Result<void, AppError>>
}
