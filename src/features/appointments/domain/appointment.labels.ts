export const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'No show', value: 'no_show' },
]

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'primary'

const TONES: Record<string, Tone> = {
  pending: 'warning',
  confirmed: 'primary',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'neutral',
}

export function statusTone(status: string | null): Tone {
  return (status && TONES[status]) || 'info'
}

export function statusLabel(status: string | null): string {
  if (!status) return '—'
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
}
