<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/shared/components/AppSidebar.vue'
import AppTopbar from '@/shared/components/AppTopbar.vue'

const route = useRoute()
const sidebarOpen = ref(false)
const title = computed(() => (route.meta.title as string) ?? 'Shefaa')
</script>

<template>
  <div class="min-h-screen bg-surface-muted">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="lg:pl-64">
      <AppTopbar :title="title" @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <slot />
      </main>
    </div>
  </div>
</template>
