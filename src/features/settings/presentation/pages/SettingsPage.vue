<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ProfileForm from '../components/ProfileForm.vue'
import ScheduleManager from '../components/ScheduleManager.vue'
import ClosureManager from '../components/ClosureManager.vue'
import NotificationsCard from '../components/NotificationsCard.vue'

const { t } = useI18n()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-semibold text-slate-900">{{ t('settings.title') }}</h1>
      <p class="text-sm text-slate-500">{{ t('settings.subtitle') }}</p>
    </div>
    <ProfileForm />
    <ScheduleManager />
    <ClosureManager />
    <NotificationsCard />
  </div>
</template>
