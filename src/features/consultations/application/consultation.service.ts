import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { IConsultationRepository } from '../domain/consultation.repository'
import type {
  Consultation,
  ConsultationListQuery,
  ConsultationListResult,
  CreateConsultationInput,
  UpdateConsultationInput,
} from '../domain/consultation.models'

export class ConsultationService {
  constructor(private readonly repo: IConsultationRepository) {}

  list(
    doctorId: number,
    query: ConsultationListQuery,
  ): Promise<Result<ConsultationListResult, AppError>> {
    return this.repo.list(doctorId, query)
  }

  getById(id: string): Promise<Result<Consultation, AppError>> {
    return this.repo.getById(id)
  }

  create(
    doctorId: number,
    input: CreateConsultationInput,
  ): Promise<Result<Consultation, AppError>> {
    return this.repo.create(doctorId, input)
  }

  update(id: string, input: UpdateConsultationInput): Promise<Result<Consultation, AppError>> {
    return this.repo.update(id, input)
  }

  remove(id: string): Promise<Result<void, AppError>> {
    return this.repo.remove(id)
  }
}
