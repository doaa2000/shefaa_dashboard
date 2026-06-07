<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { layouts, type LayoutName } from '@/shared/layouts'
import { BaseToast } from '@/shared/ui'

const route = useRoute()

// Each route declares its layout via meta.layout (defaults to the dashboard
// shell). This keeps layout selection declarative and DRY.
const layout = computed(() => layouts[(route.meta.layout as LayoutName) ?? 'dashboard'])
</script>

<template>
  <component :is="layout">
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </component>
  <BaseToast />
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
