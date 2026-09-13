import { t } from '@/app/i18n'

export const STATUS_VALUES = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
] as const

/**
 * Built on read, not once at import: a list of labels frozen at module load
 * keeps the language the app started in after the reader switches.
 */
export function statusOptions(): { label: string; value: string }[] {
  return STATUS_VALUES.map((value) => ({ label: t(`status.${value}`), value }))
}

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
  const key = `status.${status}`
  const translated = t(key)
  return translated === key ? status : translated
}
