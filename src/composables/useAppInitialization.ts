import { ref, onMounted, readonly } from 'vue'
import { useCompanyStore } from '@/stores/company/company.store'
import { useAuthStore } from '@/stores/auth/auth.store'
import { useProductsStore } from '@/stores/products/products.store.ts'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useLocaleStore } from '@/stores/locale/locale.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useWorkflowEffects } from './useWorkflowEffects'
import { useHistoryStore } from '@/stores/history/history.store'

// Global state to prevent multiple initializations
// This prevents race conditions when multiple components try to initialize the app simultaneously
let globalInitializationPromise: Promise<void> | null = null
let globalIsInitialized = false

export function useAppInitialization() {
  // Local state for this component instance
  const isInitialized = ref(globalIsInitialized)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const wf = useWorkflowStore()

  // PHASE 1: Initialize stores from localStorage (non-blocking operations)
  const initializeStoresFromLocalStorage = () => {
    // Initialize authentication state from localStorage
    try {
      const authStore = useAuthStore()
      authStore.loadFromLocalStorage()
    } catch (_err) {
      // In rare cases the store may not be available; ignore and continue
    }

    // Initialize selection/customization from localStorage
    const productsStore = useProductsStore()
    const customizationStore = useCustomizationStore()
    const hasActiveCustomization = customizationStore.loadFromLocalStorage()

    // Restore saved workflow sub-steps
    wf.loadFromLocalStorage()

    // Load history stacks early so UI reflects state immediately
    try {
      const history = useHistoryStore()
      history.load()
    } catch (_) {}

    return { productsStore, customizationStore, hasActiveCustomization }
  }

  // PHASE 2: Fetch essential data from API (blocking operations)
  const fetchEssentialData = async () => {
    const companyStore = useCompanyStore()
    const productsStore = useProductsStore()

    await Promise.all([
      companyStore.dispatchGetCompany(),
      companyStore.dispatchGetSettings(),
      productsStore.fetchCustomizedCategories()
    ])
  }

  // PHASE 3: Initialize localization and determine effective category
  const initializeLocalizationAndCategory = (
    customizationStore: any,
    productsStore: any
  ) => {
    // Initialize locale store after company data is loaded
    const localeStore = useLocaleStore()
    localeStore.initializeLocale()

    // Determine the effective category ID for loading products
    const effectiveCategoryId =
      customizationStore.activeCategoryId ||
      productsStore.categories?.data?.[0]?.id ||
      null

    if (effectiveCategoryId) {
      wf.setSelectedCategoryForPreview(effectiveCategoryId)
    }

    return effectiveCategoryId
  }

  // PHASE 4: Load product data
  const loadProductData = async (
    productsStore: any,
    effectiveCategoryId: number | null
  ) => {
    await productsStore.fetchProductPreviews(effectiveCategoryId)
  }

  // PHASE 5A: Restore customization with defaults
  const restoreCustomizationWithDefaults = async (
    customizationStore: any,
    productsStore: any,
    hasActiveCustomization: boolean
  ) => {
    if (!hasActiveCustomization) return

    const apc = customizationStore.customization
    if (!apc) return

    let productId = Number(apc.product_id || 0)

    // If productId is missing, pick first from previews
    if (!productId) {
      const fallbackProductId =
        (productsStore.productPreviews &&
          productsStore.productPreviews.length &&
          productsStore.productPreviews[0].productPreview.id) ||
        null
      if (fallbackProductId != null) {
        await productsStore.fetchStylePreviews(fallbackProductId)
        await productsStore.fetchActiveProductDetails(fallbackProductId)
        customizationStore.setProduct(fallbackProductId)
        productId = fallbackProductId
      }
    } else {
      await productsStore.fetchStylePreviews(productId)
      await productsStore.fetchActiveProductDetails(productId)
    }

    // Ensure style
    let styleId = Number(apc.style_id || 0)
    if (!styleId) {
      const defaultStyleId = productsStore.activeStyleDetails?.id
      if (defaultStyleId) {
        customizationStore.setStyle(defaultStyleId)
        styleId = defaultStyleId
      }
    } else if (productsStore.activeStyleDetails?.id !== styleId) {
      await productsStore.fetchActiveStyleDetails(styleId)
    }

    // Ensure design
    let designId = Number(apc.design_id || 0)
    if (!designId) {
      const defaultDesignId = productsStore.activeDesignDetails?.id
      if (defaultDesignId) {
        customizationStore.setDesign(defaultDesignId)
        designId = defaultDesignId
      }
    } else if (productsStore.activeDesignDetails?.id !== designId) {
      await productsStore.fetchDesignDetailsById(designId)
    }
  }

  // PHASE 5B: Create default customization
  const createDefaultCustomization = async (
    customizationStore: any,
    productsStore: any,
    effectiveCategoryId: number | null
  ) => {
    // Clear stale history when no customization is restored
    try {
      const history = useHistoryStore()
      history.clear()
    } catch (_) {}

    // Determine which product to load as default
    const activeProductId =
      customizationStore.activeProductId ||
      (productsStore.productPreviews && productsStore.productPreviews.length
        ? productsStore.productPreviews[0].productPreview.id
        : null)

    if (activeProductId != null) {
      await productsStore.fetchStylePreviews(activeProductId)
      await productsStore.fetchActiveProductDetails(activeProductId)

      if (!customizationStore.customization) {
        customizationStore.ensureCustomization()
        customizationStore.saveToLocalStorage()
      }
    }

    // Set initial workflow step
    const storedActiveStep = localStorage.getItem('activeStep')
    if (storedActiveStep) {
      wf.setActiveStep(storedActiveStep)
    } else if (effectiveCategoryId && productsStore.categories?.data?.length) {
      wf.setActiveStep('Categories')
    } else {
      wf.setActiveStep('Products')
    }
  }

  // PHASE 6: Initialize workflow effects
  const initializeWorkflowEffects = () => {
    useWorkflowEffects()
  }

  const initializeApp = async () => {
    // If already initialized globally, just return the cached result
    if (globalIsInitialized) {
      isInitialized.value = true
      return
    }

    // If initialization is already in progress globally, wait for it to complete
    if (globalInitializationPromise) {
      await globalInitializationPromise
      isInitialized.value = globalIsInitialized
      return
    }

    // If already initialized in this instance or currently loading, return early
    if (isInitialized.value || isLoading.value) return

    // Set loading state for this instance
    isLoading.value = true
    error.value = null

    // Create global promise to prevent multiple simultaneous initializations
    globalInitializationPromise = (async () => {
      try {
        // PHASE 1: Initialize stores from localStorage
        const { productsStore, customizationStore, hasActiveCustomization } =
          initializeStoresFromLocalStorage()

        // PHASE 2: Fetch essential data from API
        await fetchEssentialData()

        // PHASE 3: Initialize localization and determine effective category
        const effectiveCategoryId = initializeLocalizationAndCategory(
          customizationStore,
          productsStore
        )

        // PHASE 4: Load product data
        await loadProductData(productsStore, effectiveCategoryId)

        // PHASE 5: Set up product customization state
        if (hasActiveCustomization) {
          await restoreCustomizationWithDefaults(
            customizationStore,
            productsStore,
            hasActiveCustomization
          )
        } else {
          await createDefaultCustomization(
            customizationStore,
            productsStore,
            effectiveCategoryId
          )
        }

        // PHASE 6: Initialize workflow effects
        initializeWorkflowEffects()

        // PHASE 7: Mark initialization as complete
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

    // Wait for the global initialization to complete
    await globalInitializationPromise
  }

  // Automatically start initialization when the component is mounted
  // This ensures the app starts loading data as soon as possible
  onMounted(() => {
    initializeApp()
  })

  return {
    // Readonly state to prevent external modification
    isInitialized: readonly(isInitialized),
    isLoading: readonly(isLoading),
    error: readonly(error),
    // Expose the initialization function for manual triggering if needed
    initializeApp
  }
}
