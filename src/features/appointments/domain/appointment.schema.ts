import { z } from 'zod'
import { t } from '@/app/i18n'

// A function, like the other schemas: the messages are read in the language
// the form is shown in.
export const appointmentSchema = () =>
  z
    .object({
      // Optional, because a booking the clinic entered for somebody with no
      // account has no patient to select -- and the doctor editing its time
      // must not be made to attach a stranger's account to it first. The form
      // shows the name it has instead, and leaves this unset.
      patientId: z.string().uuid(t('appointments.modal.selectPatient')).optional(),
      bookedDate: z.string().min(1, t('validation.pickDate')),
      // A booking with no session belongs to no queue, so it cannot be optional.
      session: z.enum(['morning', 'evening'], { message: t('validation.pickSession') }),
      startTime: z.string().min(1, t('validation.startRequired')),
      endTime: z.string().min(1, t('validation.endRequired')),
      status: z.string().min(1),
    })
    .refine((d) => d.endTime > d.startTime, {
      message: t('validation.endAfterStart'),
      path: ['endTime'],
    })

export type AppointmentFormValues = z.infer<ReturnType<typeof appointmentSchema>>

/**
 * The clinic's own booking: a name and a window, and what was paid if
 * anything.
 *
 * A separate schema rather than a variant of the one above, because almost
 * nothing is shared. That form edits a booking a patient made and identifies
 * them by account; this one is written for somebody who has no account, and
 * its required field is a name typed by hand.
 */
export const clinicBookingSchema = () =>
  z.object({
    name: z.string().trim().min(2, t('validation.nameRequired')),
    // Optional, and worth asking for anyway: a number that matches an account
    // links this visit to it, and one that does not is still how the clinic
    // reaches this patient.
    phone: z.string().trim().optional(),
    bookedDate: z.string().min(1, t('validation.pickDate')),
    /** "session|startTime|endTime" -- one value, because the three are chosen
     *  together from the windows the doctor is offering that day. */
    window: z.string().min(1, t('validation.pickWindow')),
    // Left empty means the doctor's usual fee. A typed zero is a free visit
    // and is kept, so this cannot coerce empty to 0.
    amount: z
      .union([z.literal(''), z.coerce.number().min(0, t('validation.feeNotNegative'))])
      .optional(),
    paid: z.boolean(),
    method: z.string().min(1),
  })

export type ClinicBookingFormValues = z.infer<ReturnType<typeof clinicBookingSchema>>
