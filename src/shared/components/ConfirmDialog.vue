<script setup lang="ts">
import { BaseButton, BaseModal } from '@/shared/ui'

withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    message?: string
    confirmLabel?: string
    danger?: boolean
    loading?: boolean
  }>(),
  { title: 'Are you sure?', confirmLabel: 'Confirm', danger: false, loading: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean]; confirm: [] }>()
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="title"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="text-sm text-slate-600">{{ message }}</p>
    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" @click="emit('update:modelValue', false)">Cancel</BaseButton>
        <BaseButton :variant="danger ? 'danger' : 'primary'" :loading="loading" @click="emit('confirm')">
          {{ confirmLabel }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
