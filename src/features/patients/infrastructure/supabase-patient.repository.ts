import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { IPatientRepository } from '../domain/patient.repository'
import type { Patient, PatientHistory } from '../domain/patient.models'
import { toPatient } from './patient.mapper'

export class SupabasePatientRepository implements IPatientRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async listForDoctor(search?: string): Promise<Result<Patient[], AppError>> {
    try {
      const { data, error } = await this.client.rpc('doctor_patients', { search: search ?? '' })
      if (error) return err(normalizeError(error))
      return ok((data ?? []).map(toPatient))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async getById(id: string): Promise<Result<Patient, AppError>> {
    try {
      const { data, error } = await this.client.from('profiles').select('*').eq('id', id).single()
      if (error) return err(normalizeError(error))
      return ok(toPatient(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  /**
   * Through a function, not a query: the fee is on `payments`, which a doctor
   * cannot read -- that policy is the patient who owns it, or an administrator.
   * doctor_patient_visits joins on the doctor asking, so the scoping is the
   * database's rather than a filter this page could forget to send.
   */
  async getHistory(id: string): Promise<Result<PatientHistory, AppError>> {
    try {
      const { data, error } = await this.client.rpc('doctor_patient_visits', {
        p_patient: id,
      })
      if (error) return err(normalizeError(error))

      const raw = (data ?? {}) as Partial<PatientHistory>
      return ok({
        summary: {
          visits: Number(raw.summary?.visits ?? 0),
          attended: Number(raw.summary?.attended ?? 0),
          noShow: Number(raw.summary?.noShow ?? 0),
          cancelled: Number(raw.summary?.cancelled ?? 0),
          fees: Number(raw.summary?.fees ?? 0),
          firstVisit: raw.summary?.firstVisit ?? null,
          lastVisit: raw.summary?.lastVisit ?? null,
        },
        // numeric arrives as a string over the wire, so it is converted once
        // here rather than wherever it happens to be added up.
        items: (raw.items ?? []).map((v) => ({
          ...v,
          amount: v.amount == null ? null : Number(v.amount),
        })),
      })
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
