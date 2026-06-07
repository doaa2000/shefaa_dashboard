import type { AppointmentStatus, AppointmentType } from './appointment.models'

export const STATUS_OPTIONS: { label: string; value: AppointmentStatus }[] = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'No show', value: 'no_show' },
]

export const TYPE_OPTIONS: { label: string; value: AppointmentType }[] = [
  { label: 'In person', value: 'in_person' },
  { label: 'Video', value: 'video' },
  { label: 'Phone', value: 'phone' },
]

export const STATUS_TONE: Record<AppointmentStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'primary'> = {
  scheduled: 'info',
  confirmed: 'primary',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'neutral',
}

export function statusLabel(status: AppointmentStatus): string {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
}

export function typeLabel(type: AppointmentType): string {
  return TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
}
