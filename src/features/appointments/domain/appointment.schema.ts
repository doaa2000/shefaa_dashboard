import { z } from 'zod'
import { t } from '@/app/i18n'

// A function, like the other schemas: the messages are read in the language
// the form is shown in.
export const appointmentSchema = () =>
  z
    .object({
      patientId: z.string().uuid(t('appointments.modal.selectPatient')),
      bookedDate: z.string().min(1, t('validation.pickDate')),
      // A booking with no session belongs to no queue, so it cannot be optional.
      session: z.enum(['morning', 'evening'], { message: t('validation.pickSession') }),
      startTime: z.string().min(1, t('validation.startRequired')),
      endTime: z.string().min(1, t('validation.endRequired')),
      status: z.string().min(1),
      // Blank means "the doctor's standing fee", which the database fills in.
      // An empty string has to survive the coercion, or clearing the box reads
      // as zero -- a free visit nobody asked for.
      amount: z
        .union([z.literal(''), z.coerce.number().min(0, t('validation.feeNegative'))])
        .optional(),
      paymentMethod: z.string().min(1),
      paid: z.boolean().default(false),
    })
    .refine((d) => d.endTime > d.startTime, {
      message: t('validation.endAfterStart'),
      path: ['endTime'],
    })

export type AppointmentFormValues = z.infer<ReturnType<typeof appointmentSchema>>
