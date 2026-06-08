import { z } from 'zod'

export const appointmentSchema = z
  .object({
    patientId: z.string().uuid('Select a patient'),
    bookedDate: z.string().min(1, 'Pick a date'),
    startTime: z.string().min(1, 'Start time required'),
    endTime: z.string().min(1, 'End time required'),
    status: z.string().min(1),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  })

export type AppointmentFormValues = z.infer<typeof appointmentSchema>
