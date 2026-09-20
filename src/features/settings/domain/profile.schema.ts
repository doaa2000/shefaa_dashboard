import { z } from 'zod'
import { t } from '@/app/i18n'

// A function for the same reason the auth schemas are: the messages have to be
// read in the language the form is being shown in.
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
