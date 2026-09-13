<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { BaseButton, BaseModal } from '@/shared/ui'

const { t } = useI18n()

withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    message?: string
    confirmLabel?: string
    danger?: boolean
    loading?: boolean
  }>(),
  { danger: false, loading: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean]; confirm: [] }>()
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="title ?? t('common.areYouSure')"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="text-sm text-slate-600">{{ message }}</p>
    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" @click="emit('update:modelValue', false)">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :variant="danger ? 'danger' : 'primary'" :loading="loading" @click="emit('confirm')">
          {{ confirmLabel ?? t('common.confirm') }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
