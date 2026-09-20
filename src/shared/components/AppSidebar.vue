<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

interface NavItem {
  to: string
  /** A translation key, resolved at render: the sidebar has to follow a
   *  language change without being rebuilt. */
  label: string
  icon: string
}

// Heroicons-style inline path strings keep the bundle free of an icon dep.
// Consultations and prescriptions are still not in this list: the pages exist,
// but there is no table behind either and both fail on open. A link to a page
// that breaks reads as a broken system, which is worse than a system that does
// less. Notifications used to be in that company and no longer is.
const items: NavItem[] = [
  { to: '/', label: 'nav.dashboard', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { to: '/appointments', label: 'nav.appointments', icon: 'M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z' },
  { to: '/patients', label: 'nav.patients', icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2a4 4 0 10-4-4 4 4 0 004 4z' },
  { to: '/payments', label: 'nav.payments', icon: 'M3 10h18M7 15h2m4 0h4M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z' },
  { to: '/invoices', label: 'nav.invoices', icon: 'M9 12h6m-6 4h6M8 3h8a2 2 0 012 2v15l-3-2-3 2-3-2-3 2V5a2 2 0 012-2z' },
  { to: '/reports', label: 'nav.reports', icon: 'M9 17v-6m4 6V7m4 10v-3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { to: '/notifications', label: 'nav.notifications', icon: 'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9' },
  { to: '/schedule', label: 'nav.schedule', icon: 'M8 7V3m8 4V3M4 11h16M6 21h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zM9 15h6' },
  { to: '/settings', label: 'nav.settings', icon: 'M10.3 3.6a2 2 0 013.4 0l.3.5a2 2 0 002.3 1l.6-.2a2 2 0 012.4 2.4l-.2.6a2 2 0 001 2.3l.5.3a2 2 0 010 3.4l-.5.3a2 2 0 00-1 2.3l.2.6a2 2 0 01-2.4 2.4l-.6-.2a2 2 0 00-2.3 1l-.3.5a2 2 0 01-3.4 0l-.3-.5a2 2 0 00-2.3-1l-.6.2a2 2 0 01-2.4-2.4l.2-.6a2 2 0 00-1-2.3l-.5-.3a2 2 0 010-3.4l.5-.3a2 2 0 001-2.3l-.2-.6A2 2 0 016.8 4.9l.6.2a2 2 0 002.3-1zM12 15a3 3 0 100-6 3 3 0 000 6z' },
]
</script>

<template>
  <aside
    class="fixed inset-y-0 start-0 z-40 w-64 transform border-e border-surface-border bg-white transition-transform lg:translate-x-0"
    :class="
      open
        ? 'translate-x-0'
        : 'max-lg:ltr:-translate-x-full max-lg:rtl:translate-x-full'
    "
  >
    <div class="flex h-16 items-center gap-2 border-b border-surface-border px-6">
      <!-- The app's own mark. Sized by height and left at its proportions: it
           is a tall S, and a square slot padded it into a smudge. -->
      <img src="/logo.png" alt="" class="h-9 w-auto" />
      <span class="text-lg font-semibold text-slate-900">{{ t('common.appName') }}</span>
    </div>
    <nav class="space-y-1 p-3">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-primary-100"
        active-class="bg-primary-200 text-primary-900"
        @click="emit('close')"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
        </svg>
        {{ t(item.label) }}
      </RouterLink>
    </nav>
  </aside>
  <div v-if="open" class="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" @click="emit('close')" />
</template>
