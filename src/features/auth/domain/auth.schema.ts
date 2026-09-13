import { z } from 'zod'
import { t } from '@/app/i18n'

/**
 * Built on call, not at import.
 *
 * A schema created once at module load carries the messages of whatever
 * language the app started in, and keeps showing them after the reader
 * switches. The form asks for a fresh one instead.
 */
const email = () =>
  z.string().min(1, t('validation.emailRequired')).email(t('validation.emailInvalid'))

export const loginSchema = () =>
  z.object({
    email: email(),
    password: z.string().min(1, t('validation.passwordRequired')),
  })

export const registerSchema = () =>
  z
    .object({
      fullName: z.string().min(2, t('validation.fullNameRequired')),
      email: email(),
      password: z
        .string()
        .min(8, t('validation.passwordMin'))
        .regex(/[A-Za-z]/, t('validation.passwordLetter'))
        .regex(/[0-9]/, t('validation.passwordNumber')),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordsMismatch'),
      path: ['confirmPassword'],
    })

export const forgotPasswordSchema = () => z.object({ email: email() })

export type LoginInput = z.infer<ReturnType<typeof loginSchema>>
export type RegisterInput = z.infer<ReturnType<typeof registerSchema>>
export type ForgotPasswordInput = z.infer<ReturnType<typeof forgotPasswordSchema>>
