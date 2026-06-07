import { z } from 'zod'

export const consultationSchema = z.object({
  patientId: z.string().uuid('Select a patient'),
  consultedAt: z.string().min(1, 'Pick a date'),
  chiefComplaint: z.string().max(500).or(z.literal('')).nullable(),
  diagnosis: z.string().max(1000).or(z.literal('')).nullable(),
  symptoms: z.array(z.string()).default([]),
  clinicalNotes: z.string().max(5000).or(z.literal('')).nullable(),
  status: z.enum(['draft', 'finalized']),
  vitals: z
    .object({
      bloodPressure: z.string().optional(),
      heartRate: z.string().optional(),
      temperature: z.string().optional(),
      weight: z.string().optional(),
      height: z.string().optional(),
    })
    .default({}),
})

export type ConsultationFormValues = z.infer<typeof consultationSchema>
