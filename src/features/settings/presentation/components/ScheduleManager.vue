<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useScheduleStore } from '../../store/schedule.store'
import { scheduleSchema, type ScheduleFormValues } from '../../domain/schedule.schema'
import { WEEKDAYS } from '../../domain/schedule.models'
import { useToast } from '@/shared/composables/useToast'
import { titleCase } from '@/shared/utils/formatters'
import { BaseButton, BaseCard, BaseInput, BaseSelect, BaseBadge, FormField, BaseEmptyState } from '@/shared/ui'

const store = useScheduleStore()
const toast = useToast()
const { items, loading, saving } = storeToRefs(store)

const { defineField, handleSubmit, errors, resetForm } = useForm<ScheduleFormValues>({
  validationSchema: toTypedSchema(scheduleSchema),
  initialValues: { weekday: 'mon', slotDurationMinutes: 30, isActive: true },
})

const [weekday] = defineField('weekday')
const [startTime, startAttrs] = defineField('startTime')
const [endTime, endAttrs] = defineField('endTime')
const [slotDurationMinutes, slotAttrs] = defineField('slotDurationMinutes')

onMounted(() => store.fetchList())

const onSubmit = handleSubmit(async (values) => {
  const ok = await store.create(values)
  if (ok) {
    toast.success('Availability added')
    resetForm({ values: { weekday: 'mon', slotDurationMinutes: 30, isActive: true } })
  } else if (store.error) {
    toast.error('Could not add availability', store.error.message)
  }
})

async function onRemove(id: string) {
  const ok = await store.remove(id)
  if (ok) toast.success('Availability removed')
}
</script>

<template>
  <BaseCard title="Weekly availability" subtitle="Define your recurring working hours">
    <form class="grid grid-cols-1 gap-3 sm:grid-cols-5" @submit="onSubmit">
      <FormField label="Day">
        <BaseSelect v-model="weekday" :options="WEEKDAYS" :placeholder="undefined" />
      </FormField>
      <FormField label="Start" :error="errors.startTime">
        <BaseInput v-model="startTime" v-bind="startAttrs" type="time" :invalid="!!errors.startTime" />
      </FormField>
      <FormField label="End" :error="errors.endTime">
        <BaseInput v-model="endTime" v-bind="endAttrs" type="time" :invalid="!!errors.endTime" />
      </FormField>
      <FormField label="Slot (min)" :error="errors.slotDurationMinutes">
        <BaseInput v-model="slotDurationMinutes" v-bind="slotAttrs" type="number" />
      </FormField>
      <div class="flex items-end">
        <BaseButton type="submit" block :loading="saving">Add</BaseButton>
      </div>
    </form>

    <div class="mt-5">
      <BaseEmptyState v-if="!loading && items.length === 0" title="No availability set" description="Add your working hours above." />
      <ul v-else class="divide-y divide-surface-border">
        <li v-for="s in items" :key="s.id" class="flex items-center justify-between py-3">
          <div class="flex items-center gap-3">
            <BaseBadge tone="primary">{{ titleCase(s.weekday) }}</BaseBadge>
            <span class="text-sm text-slate-700">{{ s.startTime }} – {{ s.endTime }}</span>
            <span class="text-xs text-slate-400">{{ s.slotDurationMinutes }} min slots</span>
          </div>
          <BaseButton size="sm" variant="ghost" @click="onRemove(s.id)">Remove</BaseButton>
        </li>
      </ul>
    </div>
  </BaseCard>
</template>
