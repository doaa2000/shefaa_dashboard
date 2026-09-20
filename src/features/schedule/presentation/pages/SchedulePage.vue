<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BookingModeCard from '../components/BookingModeCard.vue'
import ScheduleManager from '../components/ScheduleManager.vue'
import ClosureManager from '../components/ClosureManager.vue'

const { t } = useI18n()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-semibold text-slate-900">{{ t('schedule.title') }}</h1>
      <p class="text-sm text-slate-500">{{ t('schedule.subtitle') }}</p>
    </div>
    <!-- How the clinic books first, because it is one answer the rest of the
         page assumes: every day added below joins it. Then the week, then the
         exceptions to it -- a closure is meaningless until there is a week for
         it to close a hole in. -->
    <BookingModeCard />
    <ScheduleManager />
    <ClosureManager />
  </div>
</template>
