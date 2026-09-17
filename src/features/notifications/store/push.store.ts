import { ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import type { PushState } from '../application/push.service'

export const usePushStore = defineStore('push', () => {
  const service = container.pushService

  const state = ref<PushState>('unavailable')
  const busy = ref(false)

  async function refresh(): Promise<void> {
    state.value = await service.state()
  }

  async function enable(): Promise<void> {
    busy.value = true
    state.value = await service.enable()
    busy.value = false
  }

  return { state, busy, refresh, enable }
})
