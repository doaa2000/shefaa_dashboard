import { z } from 'zod'

export const availabilitySchema = z
  .object({
    date: z.string().min(1, 'Pick a date'),
    startTime: z.string().min(1, 'Start time required'),
    endTime: z.string().min(1, 'End time required'),
    session: z.string().min(1, 'Select a session'),
    isActive: z.boolean().default(true),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  })

export type AvailabilityFormValues = z.infer<typeof availabilitySchema>

export const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  title: z.string().max(120).or(z.literal('')).nullable(),
  specialization: z.string().max(120).or(z.literal('')).nullable(),
  phone: z.string().max(30).or(z.literal('')).nullable(),
  licenseNumber: z.string().max(60).or(z.literal('')).nullable(),
  location: z.string().max(160).or(z.literal('')).nullable(),
  consultationFee: z.coerce.number().min(0).nullable(),
  bio: z.string().max(1000).or(z.literal('')).nullable(),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
