import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { IReviewRepository } from '../domain/review.repository'
import type { DoctorReview } from '../domain/review.models'

export class ReviewService {
  constructor(private readonly repo: IReviewRepository) {}

  list(doctorId: number): Promise<Result<DoctorReview[], AppError>> {
    return this.repo.list(doctorId)
  }
}
