import { onMounted, ref } from 'vue'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'

export interface PatientOption {
  label: string
  value: string
}

/**
 * Loads the doctor's patients as selectable options. Shared by every feature
 * that needs a patient picker (appointments, consultations, prescriptions).
 */
export function usePatientOptions() {
  const options = ref<PatientOption[]>([])
  const loading = ref(false)

  async function load(search?: string): Promise<void> {
    loading.value = true
    const result = await container.patientService.listForDoctor(search)
    loading.value = false
    if (isOk(result)) {
      options.value = result.value.map((p) => ({ label: p.name, value: p.id }))
    }
  }

  onMounted(() => load())

  return { options, loading, load }
}
