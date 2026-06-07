import type { WeekdayType } from '@/core/types/database.types'

export type Weekday = WeekdayType

export interface DoctorSchedule {
  id: string
  doctorId: string
  weekday: Weekday
  startTime: string
  endTime: string
  slotDurationMinutes: number
  isActive: boolean
}

export interface CreateScheduleInput {
  weekday: Weekday
  startTime: string
  endTime: string
  slotDurationMinutes: number
  isActive: boolean
}

export type UpdateScheduleInput = Partial<CreateScheduleInput>

export const WEEKDAYS: { label: string; value: Weekday }[] = [
  { label: 'Sunday', value: 'sun' },
  { label: 'Monday', value: 'mon' },
  { label: 'Tuesday', value: 'tue' },
  { label: 'Wednesday', value: 'wed' },
  { label: 'Thursday', value: 'thu' },
  { label: 'Friday', value: 'fri' },
  { label: 'Saturday', value: 'sat' },
]
