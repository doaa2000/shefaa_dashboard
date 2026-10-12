import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { DoctorReview } from './review.models'

/** Read only. A review is the patient's to write and to change. */
export interface IReviewRepository {
  list(doctorId: number): Promise<Result<DoctorReview[], AppError>>
}
