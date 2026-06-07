import { z } from 'zod'

export const patientSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email').or(z.literal('')).nullable(),
  phone: z.string().max(30).or(z.literal('')).nullable(),
  dateOfBirth: z.string().or(z.literal('')).nullable(),
  gender: z.enum(['male', 'female', 'other', 'unspecified']),
  bloodType: z.string().max(5).or(z.literal('')).nullable(),
  address: z.string().max(300).or(z.literal('')).nullable(),
  medicalHistory: z.string().max(5000).or(z.literal('')).nullable(),
  allergies: z.array(z.string()).default([]),
})

export type PatientFormValues = z.infer<typeof patientSchema>
