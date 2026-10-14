import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { IReviewRepository } from '../domain/review.repository'
import type { DoctorReview } from '../domain/review.models'

export class SupabaseReviewRepository implements IReviewRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  /**
   * The table rather than doctor_reviews_public: the public view has no note,
   * and the note is the reason this page exists. The table's policy lets a
   * doctor read the reviews about them and no others.
   *
   * Names in a second read rather than an embedded select. A doctor may read
   * the profiles of their own patients, and a patient whose profile cannot be
   * read still has a review worth showing.
   */
  async list(doctorId: number): Promise<Result<DoctorReview[], AppError>> {
    try {
      const { data, error } = await this.client
        .from('doctor_reviews')
        .select('id, patient_id, stars, comment, created_at')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })
      if (error) return err(normalizeError(error))

      const ids = [...new Set(data.map((r) => r.patient_id))]
      const names = new Map<string, string>()
      if (ids.length > 0) {
        const { data: people } = await this.client.from('profiles').select('id, name').in('id', ids)
        for (const p of people ?? []) if (p.name?.trim()) names.set(p.id, p.name.trim())
      }

      return ok(
        data.map((r) => ({
          id: r.id,
          stars: r.stars,
          comment: r.comment?.trim() || null,
          createdAt: r.created_at,
          patientName: names.get(r.patient_id) ?? null,
        })),
      )
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
