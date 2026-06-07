import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { IPrescriptionRepository } from '../domain/prescription.repository'
import type {
  CreatePrescriptionInput,
  Prescription,
  PrescriptionItemInput,
  PrescriptionListQuery,
  PrescriptionListResult,
  UpdatePrescriptionInput,
} from '../domain/prescription.models'
import { toPrescription } from './prescription.mapper'

const SELECT = '*, patients(full_name), prescription_items(*)'

function emptyToNull(value: string | null | undefined): string | null {
  return value && value.length > 0 ? value : null
}

export class SupabasePrescriptionRepository implements IPrescriptionRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async list(
    doctorId: string,
    query: PrescriptionListQuery,
  ): Promise<Result<PrescriptionListResult, AppError>> {
    try {
      let q = this.client
        .from('prescriptions')
        .select(SELECT, { count: 'exact' })
        .eq('doctor_id', doctorId)
        .order('issued_at', { ascending: false })
        .range(query.from, query.to)

      if (query.patientId) q = q.eq('patient_id', query.patientId)
      if (query.status) q = q.eq('status', query.status)

      const { data, error, count } = await q
      if (error) return err(normalizeError(error))
      return ok({ items: data.map(toPrescription), total: count ?? 0 })
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async getById(id: string): Promise<Result<Prescription, AppError>> {
    try {
      const { data, error } = await this.client.from('prescriptions').select(SELECT).eq('id', id).single()
      if (error) return err(normalizeError(error))
      return ok(toPrescription(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async create(
    doctorId: string,
    input: CreatePrescriptionInput,
  ): Promise<Result<Prescription, AppError>> {
    try {
      const { data: header, error: headerError } = await this.client
        .from('prescriptions')
        .insert({
          doctor_id: doctorId,
          patient_id: input.patientId,
          consultation_id: input.consultationId,
          status: input.status,
          notes: emptyToNull(input.notes),
          issued_at: input.issuedAt,
        })
        .select('id')
        .single()
      if (headerError) return err(normalizeError(headerError))

      const itemsError = await this.replaceItems(header.id, input.items)
      if (itemsError) return err(itemsError)

      return this.getById(header.id)
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async update(id: string, input: UpdatePrescriptionInput): Promise<Result<Prescription, AppError>> {
    try {
      const { error: headerError } = await this.client
        .from('prescriptions')
        .update({
          patient_id: input.patientId,
          consultation_id: input.consultationId,
          status: input.status,
          notes: input.notes !== undefined ? emptyToNull(input.notes) : undefined,
          issued_at: input.issuedAt,
        })
        .eq('id', id)
      if (headerError) return err(normalizeError(headerError))

      if (input.items) {
        const itemsError = await this.replaceItems(id, input.items)
        if (itemsError) return err(itemsError)
      }

      return this.getById(id)
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async remove(id: string): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client.from('prescriptions').delete().eq('id', id)
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  /** Replaces all line items for a prescription (cascade delete + reinsert). */
  private async replaceItems(
    prescriptionId: string,
    items: PrescriptionItemInput[],
  ): Promise<AppError | null> {
    const { error: deleteError } = await this.client
      .from('prescription_items')
      .delete()
      .eq('prescription_id', prescriptionId)
    if (deleteError) return normalizeError(deleteError)

    if (items.length === 0) return null

    const { error: insertError } = await this.client.from('prescription_items').insert(
      items.map((it) => ({
        prescription_id: prescriptionId,
        medication_name: it.medicationName,
        dosage: emptyToNull(it.dosage),
        frequency: emptyToNull(it.frequency),
        duration: emptyToNull(it.duration),
        instructions: emptyToNull(it.instructions),
      })),
    )
    return insertError ? normalizeError(insertError) : null
  }
}
