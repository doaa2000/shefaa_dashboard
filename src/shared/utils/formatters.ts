/** Misc display formatters. */

import { currentLocale, intlLocale, t } from '@/app/i18n'

export function initials(fullName: string | null | undefined): string {
  if (!fullName) return '?'
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function truncate(value: string, max = 80): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

/**
 * A label the app knows a translation for -- a payment method, a gender, a
 * session -- falling back to the raw value.
 *
 * The database stores these in English ('cash', 'male', 'morning'), and
 * titleCase was dressing them up rather than translating them, which in Arabic
 * left "Cash" sitting in the middle of an Arabic sentence.
 */
export function labelFor(namespace: string, value: string | null | undefined): string {
  if (!value) return '—'
  const key = `${namespace}.${value}`
  const translated = t(key)
  return translated === key ? titleCase(value) : translated
}

/** Money, in the reader's language. Fees are whole pounds far more often than
 *  not, so a trailing .00 is noise; the piastres still show when there are any. */
export function formatMoney(amount: number | null | undefined): string {
  const value = Number(amount ?? 0)
  return new Intl.NumberFormat(intlLocale(), {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat(intlLocale()).format(Number(value ?? 0))
}

/** Arabic has no plural-by-s, so the count and the noun come from the message
 *  catalogue rather than from string concatenation here. */
export function countLabel(count: number, key: string): string {
  return t(key, { count: formatNumber(count) })
}

export function isRtl(): boolean {
  return currentLocale() === 'ar'
}
