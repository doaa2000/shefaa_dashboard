import { z } from 'zod'

export const prescriptionItemSchema = z.object({
  medicationName: z.string().min(1, 'Medication name is required'),
  dosage: z.string().or(z.literal('')).nullable(),
  frequency: z.string().or(z.literal('')).nullable(),
  duration: z.string().or(z.literal('')).nullable(),
  instructions: z.string().or(z.literal('')).nullable(),
})

export const prescriptionSchema = z.object({
  patientId: z.string().uuid('Select a patient'),
  issuedAt: z.string().min(1, 'Pick an issue date'),
  status: z.enum(['active', 'completed', 'cancelled']),
  notes: z.string().max(2000).or(z.literal('')).nullable(),
  items: z.array(prescriptionItemSchema).min(1, 'Add at least one medication'),
})

export type PrescriptionFormValues = z.infer<typeof prescriptionSchema>
