import { z } from 'zod'
import { t } from '@/app/i18n'
import { planSlots, toMinutes } from './schedule.plan'

/**
 * The working-day form, for the way the clinic books.
 *
 * A function for the same reason the auth schemas are -- the messages have to
 * be read in the language the form is shown in -- and now also because what
 * the form asks for depends on the booking method. By queue the doctor types
 * how many patients; with fixed appointments the length decides the count, so
 * there is nothing to type and nothing to check beyond the hours holding at
 * least one appointment.
 */
export const scheduleSchema = (slotMinutes: number | null) =>
  z
    .object({
      weekdays: z
        .array(z.number().int().min(0).max(6))
        .min(1, t('validation.pickDays')),
      startTime: z.string().min(1, t('validation.startRequired')),
      endTime: z.string().min(1, t('validation.endRequired')),
      patients:
        slotMinutes === null
          ? z.coerce
              .number({ message: t('validation.capacityRequired') })
              .int(t('validation.capacityWhole'))
              .min(1, t('validation.capacityMin'))
              .max(200, t('validation.capacityMax'))
          : z.coerce.number().optional(),
      isActive: z.boolean().default(true),
    })
    .refine((d) => toMinutes(d.endTime) > toMinutes(d.startTime), {
      message: t('validation.endAfterStart'),
      path: ['endTime'],
    })
    .refine(
      (d) =>
        slotMinutes === null ||
        toMinutes(d.endTime) <= toMinutes(d.startTime) ||
        planSlots(d.startTime, d.endTime, slotMinutes).count > 0,
      {
        message: t('validation.shorterThanSlot', { minutes: slotMinutes ?? 0 }),
        path: ['endTime'],
      },
    )

export type ScheduleFormValues = z.infer<ReturnType<typeof scheduleSchema>>
