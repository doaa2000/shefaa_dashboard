<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePushStore } from '@/features/notifications/store/push.store'
import { BaseBadge, BaseButton, BaseCard } from '@/shared/ui'

const store = usePushStore()
const { t } = useI18n()
const { state, busy } = storeToRefs(store)

/** Refused is worth a colour: it is the one state the doctor has to leave this
 *  page to undo, and a grey badge would not say so. */
const tone = computed(() => {
  if (state.value === 'on') return 'success'
  if (state.value === 'blocked') return 'warning'
  return 'neutral'
})

onMounted(() => store.refresh())
</script>

<template>
  <BaseCard :title="t('settings.notifications')" :subtitle="t('settings.notificationsSubtitle')">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="space-y-2">
        <BaseBadge :tone="tone">{{ t(`settings.push.${state}`) }}</BaseBadge>
        <p class="text-sm text-slate-500">{{ t(`settings.pushHint.${state}`) }}</p>
      </div>

      <!-- Only shown when pressing it can do something. A browser that has been
           told no cannot be asked again from here, and a deployment with no
           notifications configured has nothing to turn on. -->
      <BaseButton v-if="state === 'off'" :loading="busy" @click="store.enable()">
        {{ t('settings.pushEnable') }}
      </BaseButton>
    </div>
  </BaseCard>
</template>
