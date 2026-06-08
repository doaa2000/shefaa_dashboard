import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'
import type {
  Credentials,
  DoctorProfile,
  DoctorProfilePatch,
  RegisterPayload,
  Session,
} from '../domain/auth.models'

export const useAuthStore = defineStore('auth', () => {
  const service = container.authService

  const session = ref<Session | null>(null)
  const profile = ref<DoctorProfile | null>(null)
  const initialized = ref(false)
  const loading = ref(false)
  const error = ref<AppError | null>(null)

  const isAuthenticated = computed(() => session.value !== null)
  const userId = computed(() => session.value?.user.id ?? null)
  /** The Doctors.id used to scope all dashboard data. */
  const doctorId = computed(() => profile.value?.id ?? null)

  let unsubscribe: (() => void) | null = null

  async function initialize(): Promise<void> {
    if (initialized.value) return
    const result = await service.getSession()
    if (isOk(result)) {
      session.value = result.value
      if (result.value) await loadProfile()
    }
    unsubscribe ??= service.observe((next) => {
      session.value = next
      if (!next) profile.value = null
    })
    initialized.value = true
  }

  async function loadProfile(): Promise<void> {
    const uid = userId.value
    if (!uid) return
    const result = await service.ensureProfile(uid, {
      name: session.value?.user.email?.split('@')[0] ?? 'Doctor',
      email: session.value?.user.email ?? '',
    })
    if (isOk(result)) profile.value = result.value
  }

  async function signIn(credentials: Credentials): Promise<boolean> {
    loading.value = true
    error.value = null
    const result = await service.signIn(credentials)
    if (isOk(result)) {
      session.value = result.value
      await loadProfile()
      loading.value = false
      return true
    }
    loading.value = false
    error.value = result.error
    return false
  }

  async function register(payload: RegisterPayload): Promise<boolean> {
    loading.value = true
    error.value = null
    const result = await service.register(payload)
    if (!isOk(result)) {
      loading.value = false
      error.value = result.error
      return false
    }
    session.value = result.value
    // Session is null only when email confirmation is required.
    if (result.value) {
      const ensured = await service.ensureProfile(result.value.user.id, {
        name: payload.fullName,
        email: payload.email,
      })
      if (isOk(ensured)) profile.value = ensured.value
    }
    loading.value = false
    return true
  }

  async function signOut(): Promise<void> {
    await service.signOut()
    session.value = null
    profile.value = null
  }

  async function updateProfile(patch: DoctorProfilePatch): Promise<boolean> {
    if (!doctorId.value) return false
    loading.value = true
    error.value = null
    const result = await service.updateProfile(doctorId.value, patch)
    loading.value = false
    if (isOk(result)) {
      profile.value = result.value
      return true
    }
    error.value = result.error
    return false
  }

  return {
    session,
    profile,
    initialized,
    loading,
    error,
    isAuthenticated,
    userId,
    doctorId,
    initialize,
    loadProfile,
    signIn,
    register,
    signOut,
    updateProfile,
  }
})
