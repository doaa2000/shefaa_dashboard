import { z } from 'zod'

export const scheduleSchema = z
  .object({
    weekday: z.enum(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']),
    startTime: z.string().min(1, 'Start time required'),
    endTime: z.string().min(1, 'End time required'),
    slotDurationMinutes: z.coerce.number().int().min(5).max(240),
    isActive: z.boolean().default(true),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  })

export type ScheduleFormValues = z.infer<typeof scheduleSchema>

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().max(30).or(z.literal('')).nullable(),
  specialty: z.string().max(120).or(z.literal('')).nullable(),
  licenseNumber: z.string().max(60).or(z.literal('')).nullable(),
  clinicName: z.string().max(120).or(z.literal('')).nullable(),
  bio: z.string().max(1000).or(z.literal('')).nullable(),
  timezone: z.string().min(1),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
