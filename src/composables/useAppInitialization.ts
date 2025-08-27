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
        productsStore.initActiveSelectionFromLocalStorage()

        // Check if we have active customization to restore
        const hasActiveCustomization =
          productsStore.initActiveCustomizationFromLocalStorage()

        // Fetch company and settings using stores
        const companyStore = useCompanyStore()
        await Promise.all([
          companyStore.dispatchGetCompany(),
          companyStore.dispatchGetSettings(),
          productsStore.activeCategoryId
            ? productsStore.dispatchGetCustomizedCategories()
            : productsStore.dispatchGetCategoriesWithNoDefaultCategoryOrProduct()
        ])

        // Determine effective category for loading products
        const effectiveCategoryId =
          productsStore.activeCategoryId ||
          productsStore.categories?.data?.[0]?.id ||
          null

        // Set the active category in customization if we have one
        if (effectiveCategoryId) {
          productsStore.setActiveCategory(effectiveCategoryId)
        }

        // Load product previews for panel
        await productsStore.dispatchGetProductPreviews(effectiveCategoryId)

        // If no categories are available, skip directly to Products step
        if (!effectiveCategoryId) {
          productsStore.setActiveStep('Products')
        }

        // Load active product details
        if (hasActiveCustomization) {
          // Hydrate from stored customization
          await productsStore.hydrateFromActiveCustomization()
        } else {
          // Default flow: load first product
          const activeProductId =
            productsStore.activeProductId ||
            (productsStore.productPreviews &&
            productsStore.productPreviews.length
              ? productsStore.productPreviews[0].product.id
              : null)
          if (activeProductId != null) {
            await productsStore.dispatchGetActiveProductDetails(activeProductId)
          }
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
