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
import { useAppStore } from '@/stores/app/app.store'

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

const COMPANY_ID_STORAGE_KEY = '__customizer_company_id__'

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
  const categoryParamsComposable = useCategoryParams()
  const appStore = useAppStore()
  const handleCompanyContextChange = (
    previousCompanyId: number | null,
    currentCompanyId: number | null,
    stores: {
      productsStore: ReturnType<typeof useProductsStore>
      customizationStore: ReturnType<typeof useCustomizationStore>
    }
  ): void => {
    const hasPreviousCompany = previousCompanyId != null
    const isDifferentCompany =
      hasPreviousCompany && (currentCompanyId == null || currentCompanyId !== previousCompanyId)

    if (isDifferentCompany) {
      storage.clearAll()

      stores.customizationStore.customization = null
      stores.customizationStore.clearLocalStorage()

      stores.productsStore.reset()

      wf.resetWorkflowSubSteps()
      wf.setActiveStep('product')

      try {
        const authStore = useAuthStore()
        authStore.clearLocalStorage()
      } catch {
        // Ignore auth reset errors
      }

      try {
        const historyStore = useHistoryStore()
        historyStore.clear()
      } catch {
        // Ignore history reset errors
      }

      try {
        const profileStore = useProfileStore()
        profileStore.clearLocalStorage()
      } catch {
        // Ignore profile reset errors
      }
    }

    if (currentCompanyId != null) {
      storage.setItemRaw(COMPANY_ID_STORAGE_KEY, String(currentCompanyId))
    } else {
      storage.removeItem(COMPANY_ID_STORAGE_KEY)
    }
  }

  // ============================================================================
  // Phase 2: Load Initial State from localStorage
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
  // Phase 3: Fetch Essential Data from API
  // ============================================================================
  // Fetches company data, settings, and product categories.
  // Company is fetched first so we can clear stale state if the tenant changed.
  const fetchEssentialData = async (
    productsStore: ReturnType<typeof useProductsStore>,
    customizationStore: ReturnType<typeof useCustomizationStore>
  ): Promise<void> => {
    const companyStore = useCompanyStore()

    const previousCompanyIdRaw = storage.getItemRaw(COMPANY_ID_STORAGE_KEY)
    const previousCompanyId = (() => {
      if (!previousCompanyIdRaw || previousCompanyIdRaw.trim().length === 0) return null
      const parsed = Number(previousCompanyIdRaw)
      return Number.isNaN(parsed) ? null : parsed
    })()

    const companyResponse = await companyStore.fetchCompany()

    if (companyResponse.success) {
      const currentCompanyId = companyResponse.content.company?.id ?? null
      handleCompanyContextChange(previousCompanyId, currentCompanyId, {
        productsStore,
        customizationStore
      })
    }

    await Promise.all([
      companyStore.fetchSettings(),
      productsStore.fetchCustomizedCategories(categoryParamsComposable.categoryParams.value)
    ])
  }

  // ============================================================================
  // Phase 4: Reload State with Correct Prefix
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
  // Phase 5: Initialize Localization and Determine Category
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

    const hasCategories = (productsStore.categories?.data?.length ?? 0) > 0
    if (!hasCategories) {
      return {
        categoryId: null
      }
    }

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
  // Phase 6: Load Product Data
  // ============================================================================
  // Fetches product previews for the selected category/subcategory.
  const loadProductData = async (
    productsStore: ReturnType<typeof useProductsStore>,
    categoryInfo: CategoryInfo
  ): Promise<void> => {
    await productsStore.fetchProductPreviews(categoryInfo.categoryId, categoryInfo.subCategoryId)
  }

  const syncWorkflowForCategoryAvailability = (hasCategories: boolean): void => {
    if (hasCategories) return

    wf.setSelectedCategoryForPreview(null)
    wf.setSelectedSubCategoryForPreview(null)

    if (wf.productsSubStep !== 'product') {
      wf.setProductsSubStep('product')
    }

    if (wf.activeStep !== 'product') {
      wf.setActiveStep('product')
    }
  }

  // ============================================================================
  // Phase 7A: Restore Existing Customization
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
  // Phase 7B: Create Default Customization
  // ============================================================================
  // Creates a new customization when no saved state exists.
  // Sets up default product, style, and design selections.
  const createDefaultCustomization = async (
    customizationStore: ReturnType<typeof useCustomizationStore>,
    productsStore: ReturnType<typeof useProductsStore>,
    categoryInfo: CategoryInfo
  ): Promise<void> => {
    const hasCategories = (productsStore.categories?.data?.length ?? 0) > 0

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
      wf.setProductsSubStep(hasCategories ? 'category' : 'product')
    }
    syncWorkflowForCategoryAvailability(hasCategories)
  }

  // ============================================================================
  // Phase 8: Initialize Workflow Effects
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
        // Phase 0: Get app info
        appStore.loadAppInfoFromGlobalVariable()

        // Phase 1: Version check of package.json
        storage.checkVersion()

        // Phase 2: Load initial state (before company data)
        const { productsStore, customizationStore } = await loadInitialStateFromLocalStorage()

        // Phase 3: Fetch company and product data
        await fetchEssentialData(productsStore, customizationStore)

        const hasCategoriesAvailable = (productsStore.categories?.data?.length ?? 0) > 0

        // Phase 4: Reload state with correct company prefix
        const hasActiveCustomization = reloadStateWithCorrectPrefix(customizationStore)

        if (!hasCategoriesAvailable) {
          syncWorkflowForCategoryAvailability(false)
        }

        // Phase 5: Initialize locale and determine category
        const categoryInfo = await initializeLocalizationAndCategory(
          customizationStore,
          productsStore
        )

        // Phase 6: Load product previews
        await loadProductData(productsStore, categoryInfo)

        // Phase 7: Restore or create customization
        if (hasActiveCustomization) {
          await restoreExistingCustomization(customizationStore, productsStore)
        } else {
          await createDefaultCustomization(customizationStore, productsStore, categoryInfo)
        }

        // Phase 8: Initialize workflow watchers
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
