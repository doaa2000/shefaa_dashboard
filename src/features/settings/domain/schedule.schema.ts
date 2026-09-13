import { z } from 'zod'
import { t } from '@/app/i18n'

// A function for the same reason the auth schemas are: the messages have to be
// read in the language the form is being shown in.
export const scheduleSchema = () =>
  z
    .object({
      weekday: z.coerce.number().int().min(0).max(6),
      session: z.enum(['morning', 'evening'], { message: t('validation.selectSession') }),
      startTime: z.string().min(1, t('validation.startRequired')),
      endTime: z.string().min(1, t('validation.endRequired')),
      capacity: z.coerce
        .number({ message: t('validation.capacityRequired') })
        .int(t('validation.capacityWhole'))
        .min(1, t('validation.capacityMin'))
        .max(200, t('validation.capacityMax')),
      /**
       * Carried as a string: 'whole' for one window, otherwise the minutes. The
       * store converts it before it reaches the database, where the same choice
       * is null or a number.
       */
      slotMinutes: z.string().default('whole'),
      isActive: z.boolean().default(true),
    })
    .refine((d) => d.endTime > d.startTime, {
      message: t('validation.endAfterStart'),
      path: ['endTime'],
    })

export type ScheduleFormValues = z.infer<ReturnType<typeof scheduleSchema>>

export const profileSchema = () =>
  z.object({
    name: z.string().min(2, t('validation.nameRequired')),
    title: z.string().max(120).or(z.literal('')).nullable(),
    specialization: z.string().max(120).or(z.literal('')).nullable(),
    phone: z.string().max(30).or(z.literal('')).nullable(),
    licenseNumber: z.string().max(60).or(z.literal('')).nullable(),
    location: z.string().max(160).or(z.literal('')).nullable(),
    consultationFee: z.coerce.number().min(0).nullable(),
    bio: z.string().max(1000).or(z.literal('')).nullable(),
  })

export type ProfileFormValues = z.infer<ReturnType<typeof profileSchema>>
