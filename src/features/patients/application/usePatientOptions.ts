import { onMounted, ref } from 'vue'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import { useAuthStore } from '@/features/auth/store/auth.store'

export interface PatientOption {
  label: string
  value: string
}

/**
 * Loads the doctor's patients as selectable options. Shared by every feature
 * that needs a patient picker (appointments, consultations, prescriptions).
 */
export function usePatientOptions() {
  const auth = useAuthStore()
  const options = ref<PatientOption[]>([])
  const loading = ref(false)

  async function load(search?: string): Promise<void> {
    if (!auth.userId) return
    loading.value = true
    const result = await container.patientService.list(auth.userId, {
      search,
      isActive: true,
      from: 0,
      to: 49,
    })
    loading.value = false
    if (isOk(result)) {
      options.value = result.value.items.map((p) => ({ label: p.fullName, value: p.id }))
    }
  }

  onMounted(() => load())

  return { options, loading, load }
}
