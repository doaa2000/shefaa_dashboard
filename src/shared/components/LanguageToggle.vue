<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { setLocale, type Locale } from '@/app/i18n'

const { t, locale } = useI18n()

/** One button, not a menu: there are two languages, and a menu to choose
 *  between two things is a menu too many. The label is always the language you
 *  would switch to, written in that language. */
function toggle() {
  setLocale((locale.value === 'ar' ? 'en' : 'ar') as Locale)
}
</script>

<template>
  <button
    class="rounded-xl border border-surface-border px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-primary-100"
    type="button"
    @click="toggle"
  >
    {{ t('common.language') }}
  </button>
</template>
