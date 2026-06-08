<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useScheduleStore } from '../../store/schedule.store'
import { availabilitySchema, type AvailabilityFormValues } from '../../domain/schedule.schema'
import { SESSION_OPTIONS } from '../../domain/schedule.models'
import { useToast } from '@/shared/composables/useToast'
import { formatDate } from '@/shared/utils/datetime'
import { titleCase } from '@/shared/utils/formatters'
import { BaseButton, BaseCard, BaseInput, BaseSelect, BaseBadge, FormField, BaseEmptyState } from '@/shared/ui'

const store = useScheduleStore()
const toast = useToast()
const { items, loading, saving } = storeToRefs(store)

const { defineField, handleSubmit, errors, resetForm } = useForm<AvailabilityFormValues>({
  validationSchema: toTypedSchema(availabilitySchema),
  initialValues: { session: 'morning', isActive: true },
})

const [date, dateAttrs] = defineField('date')
const [startTime, startAttrs] = defineField('startTime')
const [endTime, endAttrs] = defineField('endTime')
const [session] = defineField('session')

onMounted(() => store.fetchList())

const onSubmit = handleSubmit(async (values) => {
  const ok = await store.create(values)
  if (ok) {
    toast.success('Availability added')
    resetForm({ values: { session: 'morning', isActive: true } })
  } else if (store.error) {
    toast.error('Could not add availability', store.error.message)
  }
})

async function onRemove(id: number) {
  if (await store.remove(id)) toast.success('Availability removed')
}
</script>

<template>
  <BaseCard title="Availability" subtitle="Your bookable time slots by date">
    <form class="grid grid-cols-1 gap-3 sm:grid-cols-5" @submit="onSubmit">
      <FormField label="Date" :error="errors.date">
        <BaseInput v-model="date" v-bind="dateAttrs" type="date" :invalid="!!errors.date" />
      </FormField>
      <FormField label="Start" :error="errors.startTime">
        <BaseInput v-model="startTime" v-bind="startAttrs" type="time" :invalid="!!errors.startTime" />
      </FormField>
      <FormField label="End" :error="errors.endTime">
        <BaseInput v-model="endTime" v-bind="endAttrs" type="time" :invalid="!!errors.endTime" />
      </FormField>
      <FormField label="Session">
        <BaseSelect v-model="session" :options="SESSION_OPTIONS" :placeholder="undefined" />
      </FormField>
      <div class="flex items-end">
        <BaseButton type="submit" block :loading="saving">Add</BaseButton>
      </div>
    </form>

    <div class="mt-5">
      <BaseEmptyState v-if="!loading && items.length === 0" title="No availability set" description="Add your bookable slots above." />
      <ul v-else class="divide-y divide-surface-border">
        <li v-for="s in items" :key="s.id" class="flex items-center justify-between py-3">
          <div class="flex items-center gap-3">
            <BaseBadge tone="primary">{{ formatDate(s.date) }}</BaseBadge>
            <span class="text-sm text-slate-700">{{ s.startTime?.slice(0, 5) }} – {{ s.endTime?.slice(0, 5) }}</span>
            <span v-if="s.session" class="text-xs text-slate-400">{{ titleCase(s.session) }}</span>
            <BaseBadge v-if="!s.isActive" tone="neutral">Inactive</BaseBadge>
          </div>
          <BaseButton size="sm" variant="ghost" @click="onRemove(s.id)">Remove</BaseButton>
        </li>
      </ul>
    </div>
  </BaseCard>
</template>
