import { z } from 'zod'

export const appointmentSchema = z.object({
  patientId: z.string().uuid('Select a patient'),
  scheduledAt: z.string().min(1, 'Pick a date & time'),
  durationMinutes: z.coerce.number().int().min(5, 'Minimum 5 minutes').max(480),
  type: z.enum(['in_person', 'video', 'phone']),
  reason: z.string().max(500).or(z.literal('')).nullable(),
  notes: z.string().max(2000).or(z.literal('')).nullable(),
})

export type AppointmentFormValues = z.infer<typeof appointmentSchema>
