<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { BaseAvatar } from '@/shared/ui'
import NotificationBell from './NotificationBell.vue'

defineProps<{ title: string }>()
const emit = defineEmits<{ toggleSidebar: [] }>()

const router = useRouter()
const auth = useAuthStore()

async function signOut() {
  await auth.signOut()
  await router.replace('/login')
}
</script>

<template>
  <header class="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-surface-border bg-white/80 px-4 backdrop-blur lg:px-6">
    <div class="flex items-center gap-3">
      <button class="rounded-xl p-2 text-slate-500 hover:bg-surface-muted lg:hidden" aria-label="Menu" @click="emit('toggleSidebar')">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h2 class="text-base font-semibold text-slate-800">{{ title }}</h2>
    </div>

    <div class="flex items-center gap-2">
      <NotificationBell />
      <div class="group relative">
        <button class="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-surface-muted">
          <BaseAvatar :name="auth.profile?.fullName" :src="auth.profile?.avatarUrl" size="sm" />
          <span class="hidden text-sm font-medium text-slate-700 sm:block">
            {{ auth.profile?.fullName || 'Doctor' }}
          </span>
        </button>
        <div class="absolute right-0 mt-1 hidden w-44 rounded-xl border border-surface-border bg-white py-1 shadow-elevated group-hover:block">
          <RouterLink to="/settings" class="block px-4 py-2 text-sm text-slate-600 hover:bg-surface-muted">
            Settings
          </RouterLink>
          <button class="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-surface-muted" @click="signOut">
            Sign out
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
