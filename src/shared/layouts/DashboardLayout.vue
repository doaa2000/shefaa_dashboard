<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppSidebar from '@/shared/components/AppSidebar.vue'
import AppTopbar from '@/shared/components/AppTopbar.vue'
import { useNotificationStore } from '@/features/notifications/store/notification.store'

const route = useRoute()
const sidebarOpen = ref(false)
const { t } = useI18n()

// Here rather than in the sidebar, because the count belongs to the signed-in
// session and not to the badge that happens to draw it: the list page reads
// the same store, and neither should be fetching on the other's behalf.
const notifications = useNotificationStore()
let stopWatching: (() => void) | null = null

onMounted(() => {
  void notifications.fetch()
  stopWatching = notifications.keepFresh()
})

onUnmounted(() => stopWatching?.())
const title = computed(() =>
  route.meta.titleKey ? t(route.meta.titleKey as string) : t('common.appName'),
)
</script>

<template>
  <div class="min-h-screen bg-surface-muted">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="lg:ps-64">
      <AppTopbar :title="title" @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <slot />
      </main>
    </div>
  </div>
</template>
