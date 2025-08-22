import { ref, onMounted, readonly } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'

// Global state to prevent multiple initializations
let globalInitializationPromise: Promise<void> | null = null
let globalIsInitialized = false

export function useAppInitialization() {
  const isInitialized = ref(globalIsInitialized)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

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
        // Initialize authentication from localStorage (non-blocking)
        try {
          const authStore = useAuthStore()
          authStore.initCustomerAndAccessTokenFromLocalStorage()
        } catch (_err) {
          // In rare cases the store may not be available; ignore and continue
        }

        // Initialize products store from localStorage (non-blocking)
        const productsStore = useProductsStore()
        productsStore.initLastCategoryIdFromLocalStorage()
        productsStore.initActiveSelectionFromLocalStorage()

        // Fetch company and settings using stores
        const companyStore = useCompanyStore()
        await Promise.all([
          companyStore.dispatchGetCompany(),
          companyStore.dispatchGetSettings(),
          productsStore.lastCategoryId
            ? productsStore.dispatchGetCustomizedCategories()
            : productsStore.dispatchGetCategoriesWithNoDefaultCategoryOrProduct()
        ])

        // Determine active category
        const effectiveCategoryId =
          productsStore.activeCategoryId ||
          productsStore.lastCategoryId ||
          productsStore.categories?.data?.[0]?.id ||
          null
        productsStore.setActiveCategory(effectiveCategoryId)

        // Load product previews for panel
        await productsStore.dispatchGetProductPreviews(effectiveCategoryId)

        // Load active product details
        const activeProductId =
          productsStore.activeProductId ||
          (productsStore.productPreviews && productsStore.productPreviews.length
            ? productsStore.productPreviews[0].product.id
            : null)
        if (activeProductId != null) {
          await productsStore.dispatchGetActiveProductDetails(activeProductId)
        }

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
    // company: readonly(company),
    // settings: readonly(settings),
    initializeApp
  }
}
