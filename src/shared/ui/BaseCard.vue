<script setup lang="ts">
withDefaults(defineProps<{ title?: string; subtitle?: string; padded?: boolean }>(), {
  padded: true,
})
</script>

<template>
  <section class="rounded-2xl border border-surface-border bg-white shadow-card">
    <header
      v-if="title || $slots.header || $slots.actions"
      class="flex items-center justify-between gap-4 border-b border-surface-border px-5 py-4"
    >
      <div>
        <slot name="header">
          <h3 class="text-sm font-semibold text-slate-800">{{ title }}</h3>
          <p v-if="subtitle" class="mt-0.5 text-xs text-slate-500">{{ subtitle }}</p>
        </slot>
      </div>
      <div v-if="$slots.actions"><slot name="actions" /></div>
    </header>
    <div :class="padded ? 'p-5' : ''">
      <slot />
    </div>
  </section>
</template>
