<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ProfileForm from '../components/ProfileForm.vue'
import NotificationsCard from '../components/NotificationsCard.vue'
import PasswordCard from '../components/PasswordCard.vue'

const { t } = useI18n()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-semibold text-slate-900">{{ t('settings.title') }}</h1>
      <p class="text-sm text-slate-500">{{ t('settings.subtitle') }}</p>
    </div>
    <ProfileForm />
    <PasswordCard />
    <NotificationsCard />
  </div>
</template>
