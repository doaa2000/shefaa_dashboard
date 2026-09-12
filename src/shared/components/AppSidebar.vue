<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

interface NavItem {
  to: string
  label: string
  icon: string
}

// Heroicons-style inline path strings keep the bundle free of an icon dep.
// Consultations, prescriptions and notifications are not in this list because
// they are not built: the pages exist, but there is no table behind any of
// them and every one of them fails on open. A link to a page that breaks reads
// as a broken system, which is worse than a system that does less.
const items: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { to: '/queue', label: "Today's queue", icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { to: '/appointments', label: 'Appointments', icon: 'M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z' },
  { to: '/patients', label: 'Patients', icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2a4 4 0 10-4-4 4 4 0 004 4z' },
  { to: '/payments', label: 'Payments', icon: 'M3 10h18M7 15h2m4 0h4M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z' },
  { to: '/reports', label: 'Reports', icon: 'M9 17v-6m4 6V7m4 10v-3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { to: '/settings', label: 'Settings', icon: 'M10.3 3.6a2 2 0 013.4 0l.3.5a2 2 0 002.3 1l.6-.2a2 2 0 012.4 2.4l-.2.6a2 2 0 001 2.3l.5.3a2 2 0 010 3.4l-.5.3a2 2 0 00-1 2.3l.2.6a2 2 0 01-2.4 2.4l-.6-.2a2 2 0 00-2.3 1l-.3.5a2 2 0 01-3.4 0l-.3-.5a2 2 0 00-2.3-1l-.6.2a2 2 0 01-2.4-2.4l.2-.6a2 2 0 00-1-2.3l-.5-.3a2 2 0 010-3.4l.5-.3a2 2 0 001-2.3l-.2-.6A2 2 0 016.8 4.9l.6.2a2 2 0 002.3-1zM12 15a3 3 0 100-6 3 3 0 000 6z' },
]
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 w-64 transform border-r border-surface-border bg-white transition-transform lg:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex h-16 items-center gap-2 border-b border-surface-border px-6">
      <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-white font-bold">S</span>
      <span class="text-lg font-semibold text-slate-900">Shefaa</span>
    </div>
    <nav class="space-y-1 p-3">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-surface-muted"
        active-class="bg-primary-50 text-primary-700"
        @click="emit('close')"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
        </svg>
        {{ item.label }}
      </RouterLink>
    </nav>
  </aside>
  <div v-if="open" class="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" @click="emit('close')" />
</template>
