<script setup lang="ts">
import ProfileForm from '../components/ProfileForm.vue'
import ScheduleManager from '../components/ScheduleManager.vue'
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-semibold text-slate-900">Settings</h1>
      <p class="text-sm text-slate-500">Manage your profile and availability</p>
    </div>
    <ProfileForm />
    <ScheduleManager />
  </div>
</template>
