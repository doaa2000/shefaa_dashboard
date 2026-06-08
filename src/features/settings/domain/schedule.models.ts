/** A date-specific availability slot, backed by `doctor_availability`. */
export interface AvailabilitySlot {
  id: number
  doctorId: number
  date: string
  startTime: string | null
  endTime: string | null
  session: string | null
  isActive: boolean
}

export interface CreateAvailabilityInput {
  date: string
  startTime: string
  endTime: string
  session: string
  isActive: boolean
}

export type UpdateAvailabilityInput = Partial<CreateAvailabilityInput>

export const SESSION_OPTIONS: { label: string; value: string }[] = [
  { label: 'Morning', value: 'morning' },
  { label: 'Afternoon', value: 'afternoon' },
  { label: 'Evening', value: 'evening' },
]
