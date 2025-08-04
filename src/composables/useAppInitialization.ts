import { ref, onMounted, readonly } from 'vue'
import companyService from '@/services/company'
import type { OutputCompany, OutputSettings } from '@/services/company/types'

// Global state to prevent multiple initializations
let globalInitializationPromise: Promise<void> | null = null
let globalIsInitialized = false

export function useAppInitialization() {
  const isInitialized = ref(globalIsInitialized)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const company = ref<OutputCompany | null>(null)
  const settings = ref<OutputSettings | null>(null)

  const initializeApp = async () => {
    // If already initialized globally, just return
    if (globalIsInitialized) {
      isInitialized.value = true
      return
    }

    // If initialization is already in progress, wait for it
    if (globalInitializationPromise) {
      await globalInitializationPromise
      isInitialized.value = globalIsInitialized
      return
    }

    // If already initialized in this instance, return
    if (isInitialized.value || isLoading.value) return

    isLoading.value = true
    error.value = null

    // Create global promise to prevent multiple simultaneous initializations
    globalInitializationPromise = (async () => {
      try {
        // Fetch company and settings in parallel
        const [companyResponse, settingsResponse] = await Promise.all([
          companyService.getCompany(),
          companyService.getSettings()
        ])

        company.value = companyResponse.data
        settings.value = settingsResponse.data
        isInitialized.value = true
        globalIsInitialized = true
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : 'Failed to initialize app'
      } finally {
        isLoading.value = false
        globalInitializationPromise = null
      }
    })()

    await globalInitializationPromise
  }

  onMounted(() => {
    initializeApp()
  })

  return {
    isInitialized: readonly(isInitialized),
    isLoading: readonly(isLoading),
    error: readonly(error),
    company: readonly(company),
    settings: readonly(settings),
    initializeApp
  }
}
