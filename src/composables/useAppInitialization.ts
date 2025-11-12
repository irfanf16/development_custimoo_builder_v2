import { ref, onMounted, readonly } from 'vue'
import { useCompanyStore } from '@/stores/company/company.store'
import { useAuthStore } from '@/stores/auth/auth.store'
import { useProductsStore } from '@/stores/products/products.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useWorkflow } from './useWorkflow'
import { useHistoryStore } from '@/stores/history/history.store'
import { useCategoryParams } from './useCategoryParams'
import type { OutputDesignDetails } from '../services/products/types'
import { useProfileStore } from '@/stores/profile/profile.store'
import { useLocalStorage } from './useLocalStorage'

// ============================================================================
// Global State Management
// ============================================================================
// Prevents race conditions when multiple components try to initialize simultaneously
let globalInitializationPromise: Promise<void> | null = null
let globalIsInitialized = false

// ============================================================================
// Type Definitions
// ============================================================================
type StoreInstances = {
  productsStore: ReturnType<typeof useProductsStore>
  customizationStore: ReturnType<typeof useCustomizationStore>
}

type CategoryInfo = {
  categoryId: number | null
  subCategoryId?: number
}

// ============================================================================
// Main Composable
// ============================================================================
export function useAppInitialization() {
  // Local state for this component instance
  const isInitialized = ref(globalIsInitialized)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Store instances
  const wf = useWorkflowStore()
  const storage = useLocalStorage()

  // ============================================================================
  // Phase 1: Load Initial State from localStorage
  // ============================================================================
  // Loads state from localStorage before company data is available.
  // This provides immediate UI feedback, but data will be reloaded with correct
  // prefix after company is fetched.
  const loadInitialStateFromLocalStorage = async (): Promise<StoreInstances> => {
    // Load authentication state
    try {
      const authStore = useAuthStore()
      await authStore.loadFromLocalStorage()
    } catch {
      // Store may not be available in rare cases; continue initialization
    }

    // Load stores
    const productsStore = useProductsStore()
    const customizationStore = useCustomizationStore()
    customizationStore.loadFromLocalStorage()

    // Load workflow state (will be reloaded with correct prefix later)
    wf.loadFromLocalStorage()

    // Load history stacks for immediate UI feedback
    try {
      const history = useHistoryStore()
      history.load()
    } catch {
      // Ignore errors when loading history
    }

    return { productsStore, customizationStore }
  }

  // ============================================================================
  // Phase 2: Fetch Essential Data from API
  // ============================================================================
  // Fetches company data, settings, and product categories.
  // This must complete before we can use company-specific localStorage prefixes.
  const fetchEssentialData = async (): Promise<void> => {
    const companyStore = useCompanyStore()
    const productsStore = useProductsStore()
    const { categoryParams } = useCategoryParams()

    // Fetch in parallel for better performance
    await Promise.all([
      companyStore.fetchCompany(),
      companyStore.fetchSettings(),
      productsStore.fetchCustomizedCategories(categoryParams.value)
    ])
  }

  // ============================================================================
  // Phase 3: Reload State with Correct Prefix
  // ============================================================================
  // Now that company data is available, reload localStorage data with the
  // correct company-specific prefix to ensure we're using the right keys.
  const reloadStateWithCorrectPrefix = (
    customizationStore: ReturnType<typeof useCustomizationStore>
  ): boolean => {
    wf.loadFromLocalStorage()
    return customizationStore.loadFromLocalStorage()
  }

  // ============================================================================
  // Phase 4: Initialize Localization and Determine Category
  // ============================================================================
  // Sets up user locale and determines which category/subcategory to use.
  // Priority: URL params > localStorage > API defaults
  const initializeLocalizationAndCategory = async (
    customizationStore: ReturnType<typeof useCustomizationStore>,
    productsStore: ReturnType<typeof useProductsStore>
  ): Promise<CategoryInfo> => {
    // Initialize user locale preferences
    const profileStore = useProfileStore()
    await profileStore.initializeLocale()

    // Determine effective category (priority order)
    const effectiveCategoryId =
      productsStore.categories?.product_category_id ?? // 1. URL/API params
      customizationStore.activeCategoryId ?? // 2. User's previous selection
      productsStore.categories?.data?.[0]?.id ?? // 3. First available
      null

    // Determine effective subcategory (priority order)
    let effectiveSubCategoryId =
      productsStore.categories?.product_sub_category_id ?? // 1. URL/API params
      customizationStore.activeSubCategoryId ?? // 2. User's previous selection
      undefined

    // If category exists but no subcategory, use first subcategory from that category
    if (effectiveCategoryId && !effectiveSubCategoryId) {
      const category = productsStore.categories?.data?.find(c => c.id === effectiveCategoryId)
      effectiveSubCategoryId = category?.subcategories?.[0]?.id ?? undefined
    }

    // Update workflow preview selection
    if (effectiveCategoryId) {
      wf.setSelectedCategoryForPreview(effectiveCategoryId)
    }

    return {
      categoryId: effectiveCategoryId,
      subCategoryId: effectiveSubCategoryId
    }
  }

  // ============================================================================
  // Phase 5: Load Product Data
  // ============================================================================
  // Fetches product previews for the selected category/subcategory.
  const loadProductData = async (
    productsStore: ReturnType<typeof useProductsStore>,
    categoryInfo: CategoryInfo
  ): Promise<void> => {
    await productsStore.fetchProductPreviews(categoryInfo.categoryId, categoryInfo.subCategoryId)
  }

  // ============================================================================
  // Phase 6A: Restore Existing Customization
  // ============================================================================
  // Restores user's saved customization and ensures all related data is loaded.
  // Preserves all user changes while syncing with current API state.
  const restoreExistingCustomization = async (
    customizationStore: ReturnType<typeof useCustomizationStore>,
    productsStore: ReturnType<typeof useProductsStore>
  ): Promise<void> => {
    const customization = customizationStore.customization
    if (!customization) return

    // Restore product selection
    let productId = Number(customization.product_id || 0)

    // Load product data if missing
    if (!productId) {
      // Fallback to first available product
      const fallbackProductId = productsStore.productPreviews?.[0]?.productPreview.id ?? null
      if (fallbackProductId) {
        await productsStore.fetchStylePreviews(fallbackProductId)
        await productsStore.fetchActiveProductDetails(fallbackProductId)
        customizationStore.setProduct(fallbackProductId)
        productId = fallbackProductId
      }
    } else {
      // Load data for saved product
      await productsStore.fetchStylePreviews(productId)
      await productsStore.fetchActiveProductDetails(productId)
    }

    // Restore style selection
    let styleId = Number(customization.style_id || 0)
    if (!styleId) {
      // Use default style if none saved
      const defaultStyleId = productsStore.activeStyleDetails?.id
      if (defaultStyleId) {
        customizationStore.setStyle(defaultStyleId)
        styleId = defaultStyleId
      }
    } else if (productsStore.activeStyleDetails?.id !== styleId) {
      // Load saved style if different from current
      await productsStore.fetchActiveStyleDetails(styleId)
    }

    // Restore design selection
    let designId = Number(customization.design_id || 0)
    if (!designId) {
      const defaultDesignId = productsStore.activeDesignDetails?.id
      if (defaultDesignId) {
        void customizationStore.setDesign(productsStore.activeDesignDetails as OutputDesignDetails)
        designId = defaultDesignId
      }
    } else if (productsStore.activeDesignDetails?.id !== designId) {
      await productsStore.fetchDesignDetailsById(designId)
    }

    // Ensure product_texts are initialized from activeProductDetails
    // This is a safety measure in case texts weren't initialized during fetchActiveProductDetails
    if (
      productId &&
      productsStore.activeProductDetails?.product_texts &&
      productsStore.activeProductDetails.product_texts.length > 0
    ) {
      customizationStore.initializeProductTextsFromDetails(
        productId,
        productsStore.activeProductDetails.product_texts
      )
    }
  }

  // ============================================================================
  // Phase 6B: Create Default Customization
  // ============================================================================
  // Creates a new customization when no saved state exists.
  // Sets up default product, style, and design selections.
  const createDefaultCustomization = async (
    customizationStore: ReturnType<typeof useCustomizationStore>,
    productsStore: ReturnType<typeof useProductsStore>,
    categoryInfo: CategoryInfo
  ): Promise<void> => {
    // Clear history when starting fresh
    try {
      const history = useHistoryStore()
      history.clear()
    } catch {
      // Ignore errors when clearing history
    }

    // Determine default product to load
    const defaultProductId =
      customizationStore.activeProductId ??
      productsStore.productPreviews?.[0]?.productPreview.id ??
      null

    if (defaultProductId) {
      // Load product data
      await productsStore.fetchStylePreviews(defaultProductId)
      await productsStore.fetchActiveProductDetails(defaultProductId)

      // Create default customization
      customizationStore.ensureCustomization({
        productId: defaultProductId,
        styleId: productsStore.activeStyleDetails?.id,
        designId: productsStore.activeDesignDetails?.id,
        categoryId: customizationStore.activeCategoryId ?? categoryInfo.categoryId ?? undefined,
        subCategoryId:
          customizationStore.activeSubCategoryId ?? categoryInfo.subCategoryId ?? undefined
      })
      customizationStore.saveToLocalStorage()
    }

    // Set default workflow step
    if (!wf.activeStep) {
      wf.setActiveStep('product')
    }
    if (wf.activeStep === 'product') {
      wf.setProductsSubStep('category')
    }
  }

  // ============================================================================
  // Phase 7: Initialize Workflow Effects
  // ============================================================================
  // Sets up reactive watchers for workflow state changes.
  const initializeWorkflowEffects = (): void => {
    const { initializeEffects } = useWorkflow()
    initializeEffects()
  }

  // ============================================================================
  // Main Initialization Function
  // ============================================================================
  const initializeApp = async (): Promise<void> => {
    // Early returns for already initialized or in-progress cases
    if (globalIsInitialized) {
      isInitialized.value = true
      return
    }

    if (globalInitializationPromise) {
      await globalInitializationPromise
      isInitialized.value = globalIsInitialized
      return
    }

    if (isInitialized.value || isLoading.value) return

    // Start initialization
    isLoading.value = true
    error.value = null

    // Create global promise to prevent concurrent initializations
    globalInitializationPromise = (async () => {
      try {
        // Phase 0: Version check (must be first)
        storage.checkVersion()

        // Phase 1: Load initial state (before company data)
        const { productsStore, customizationStore } = await loadInitialStateFromLocalStorage()

        // Phase 2: Fetch company and product data
        await fetchEssentialData()

        // Phase 3: Reload state with correct company prefix
        const hasActiveCustomization = reloadStateWithCorrectPrefix(customizationStore)

        // Phase 4: Initialize locale and determine category
        const categoryInfo = await initializeLocalizationAndCategory(
          customizationStore,
          productsStore
        )

        // Phase 5: Load product previews
        await loadProductData(productsStore, categoryInfo)

        // Phase 6: Restore or create customization
        if (hasActiveCustomization) {
          await restoreExistingCustomization(customizationStore, productsStore)
        } else {
          await createDefaultCustomization(customizationStore, productsStore, categoryInfo)
        }

        // Phase 7: Initialize workflow watchers
        initializeWorkflowEffects()

        // Mark as complete
        isInitialized.value = true
        globalIsInitialized = true
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to initialize app'
        console.error('App initialization error:', err)
      } finally {
        isLoading.value = false
        globalInitializationPromise = null
      }
    })()

    await globalInitializationPromise
  }

  // Automatically start initialization when the component is mounted
  // This ensures the app starts loading data as soon as possible
  onMounted(() => {
    void initializeApp()
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
