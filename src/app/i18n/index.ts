import { createI18n } from 'vue-i18n'
import { en } from './locales/en'
import { ar } from './locales/ar'

export type Locale = 'ar' | 'en'

const STORAGE_KEY = 'shefaa.locale'

/** Arabic by default: the clinics this runs in are Egyptian, and a doctor
 *  should not have to find a switch before the dashboard speaks to them. */
const FALLBACK: Locale = 'ar'

function storedLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'ar' || saved === 'en') return saved
  } catch {
    // A browser with storage blocked still gets a working dashboard, just not
    // a remembered language.
  }
  return FALLBACK
}

export const i18n = createI18n({
  legacy: false,
  locale: storedLocale(),
  fallbackLocale: 'en',
  messages: { en, ar },
})

export function currentLocale(): Locale {
  return i18n.global.locale.value as Locale
}

/** Which Intl locale to format dates and numbers with.
 *
 *  -u-nu-latn keeps the digits Latin. Arabic-Indic numerals are correct Arabic
 *  and wrong for this screen: the clinic reads prices, phone numbers and times
 *  in Latin digits everywhere else, including on the patients' own app. */
export function intlLocale(): string {
  return currentLocale() === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB'
}

export function setLocale(locale: Locale): void {
  i18n.global.locale.value = locale
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Same as above: not remembering is survivable, throwing is not.
  }
  applyDocumentLocale()
}

/** The whole layout mirrors from this attribute, so it has to be set before
 *  the first paint and again on every change. */
export function applyDocumentLocale(): void {
  const locale = currentLocale()
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
}

/** Translation outside a component -- stores, schemas, error defaults. */
export function t(key: string, named?: Record<string, unknown>): string {
  return named
    ? i18n.global.t(key, named as Record<string, unknown>)
    : i18n.global.t(key)
}
