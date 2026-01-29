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
import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
import { useLocalStorage } from './useLocalStorage'
import { useAppStore } from '@/stores/app/app.store'
import { getCustomizerIframe } from '../lib/widgetUtils'
import router from '../router'
import { useCartStore } from '@/stores/cart/cart.store'
import { useQueryParams } from '@/composables/useQueryParams'
import { useLoadCartProductIntoCustomizer } from './useLoadCartProductIntoCustomizer'

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

type InitializationContext = {
  stores: StoreInstances
  hasPersistedCustomization: boolean
  categoryInfo: CategoryInfo | null
  hasCategoriesAvailable: boolean
  companyChanged: boolean
  hadPersistedWorkflowStep: boolean
}

type InitializationPhase =
  | 'sync-query-params'
  | 'load-app-info'
  | 'check-storage-version'
  | 'hydrate-persistent-stores'
  | 'fetch-essential-data'
  | 'determine-category'
  | 'load-product-previews'
  | 'hydrate-customization'
  | 'initialize-workflow-effects'

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
  ): boolean => {
    const hasPreviousCompany = previousCompanyId != null
    const isDifferentCompany =
      hasPreviousCompany && (currentCompanyId == null || currentCompanyId !== previousCompanyId)
    let tenantChanged = false

    if (isDifferentCompany) {
      tenantChanged = true
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

    return tenantChanged
  }

  // ============================================================================
  // Phase 0: Check if the app has been loaded in an iframe and forward url params if needed
  // ============================================================================
  const syncQueryParamsIfEmbedded = async (): Promise<void> => {
    if (typeof window === 'undefined') return
    const iframe = getCustomizerIframe()
    if (!iframe) return

    // Propagate host query params into the widget route so a shadow DOM host stays in sync.
    const url = new URL(window.location.href)
    const nextQuery: Record<string, string> = {}
    url.searchParams.forEach((value, key) => {
      nextQuery[key] = value
    })

    const currentQuery = router.currentRoute.value.query
    const normalizedCurrent = Object.entries(currentQuery).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        acc[key] = Array.isArray(value) ? value.join(',') : String(value)
        return acc
      },
      {}
    )
    const queryMatches =
      Object.keys(nextQuery).length === Object.keys(normalizedCurrent).length &&
      Object.entries(nextQuery).every(([key, value]) => normalizedCurrent[key] === value)

    if (queryMatches) return

    await router.push({ query: nextQuery }).catch(error => {
      console.error('Error forwarding url params to iframe:', error)
    })
  }

  // ============================================================================
  // Phase 3: Load Initial State from localStorage
  // ============================================================================
  // Loads state from localStorage before company data is available.
  // This provides immediate UI feedback, but data will be reloaded with correct
  // prefix after company is fetched.
  const hydratePersistentStores = async (): Promise<InitializationContext> => {
    try {
      const authStore = useAuthStore()
      await authStore.ensureHydrated()

      // Fetch cart if user is authenticated (after auth is hydrated)
      if (authStore.isAuthenticated) {
        try {
          const cartStore = useCartStore()
          await cartStore.fetchCart()
        } catch {
          // Ignore cart fetch errors so the rest of the pipeline can continue
        }
      } else {
        // If not authenticated, start listening for external auth
        authStore.startListeningForAuth()
      }
    } catch {
      // Ignore hydration errors so the rest of the pipeline can continue.
    }

    const productsStore = useProductsStore()
    productsStore.suspendCustomizationAutoSync()
    const customizationStore = useCustomizationStore()

    const { hasSyncId } = useQueryParams()

    if (!hasSyncId.value) {
      try {
        const history = useHistoryStore()
        history.load()
      } catch {
        // Ignore errors when loading history
      }
    }

    const hasPersistedCustomization = hasSyncId.value
      ? false
      : customizationStore.loadFromLocalStorage()

    return {
      stores: { productsStore, customizationStore },
      hasPersistedCustomization,
      categoryInfo: null,
      hasCategoriesAvailable: false,
      companyChanged: false,
      hadPersistedWorkflowStep: false
    }
  }

  // ============================================================================
  // Phase 4: Fetch Essential Data from API
  // ============================================================================
  // Fetches company data, settings, and product categories.
  // Company is fetched first so we can clear stale state if the tenant changed.
  const fetchEssentialData = async (context: InitializationContext): Promise<void> => {
    const { productsStore, customizationStore } = context.stores
    const companyStore = useCompanyStore()
    const { hasSyncId } = useQueryParams()
    const lockerRoomStore = useLockerRoomStore()

    const previousCompanyIdRaw = storage.getItemRaw(COMPANY_ID_STORAGE_KEY)
    const previousCompanyId = (() => {
      if (!previousCompanyIdRaw || previousCompanyIdRaw.trim().length === 0) return null
      const parsed = Number(previousCompanyIdRaw)
      return Number.isNaN(parsed) ? null : parsed
    })()

    const companyResponse = await companyStore.fetchCompany()

    if (companyResponse.success) {
      const currentCompanyId = companyResponse.content.company?.id ?? null
      const companyChanged = handleCompanyContextChange(previousCompanyId, currentCompanyId, {
        productsStore,
        customizationStore
      })
      context.companyChanged = companyChanged
      if (companyChanged) {
        context.hasPersistedCustomization = false
      }
    }

    await Promise.all([
      companyStore.fetchSettings(),
      productsStore.fetchCustomizedCategories(categoryParamsComposable.categoryParams.value)
    ])

    context.hasCategoriesAvailable = (productsStore.categories?.data?.length ?? 0) > 0
    // Fetch locker room with colors data
    await lockerRoomStore.fetchLockersWithcolors()

    if (hasSyncId.value) {
      wf.setActiveStep('designs')
    } else {
      // Reload workflow state now that the correct storage prefix is known
      wf.loadFromLocalStorage()
      context.hadPersistedWorkflowStep = Boolean(wf.activeStep)
    }
  }

  // ============================================================================
  // Phase 5: Reload State with Correct Prefix
  // ============================================================================
  // Now that company data is available, reload localStorage data with the
  // correct company-specific prefix to ensure we're using the right keys.
  const hydrateCustomizationState = async (
    context: InitializationContext,
    categoryInfo: CategoryInfo
  ): Promise<void> => {
    const { hasSyncId, updateCart, updateItem } = useQueryParams()
    const { customizationStore, productsStore } = context.stores
    const { loadCartProductIntoCustomizer } = useLoadCartProductIntoCustomizer()
    if (hasSyncId.value) {
      if (updateCart.value && updateItem.value) {
        await loadCartProductIntoCustomizer(String(updateItem.value), Number(updateCart.value))
        const { isRosterParam } = useQueryParams()
        if (isRosterParam.value) {
          wf.setActiveStep('roster')
        }
        return
      }
      await createEcommerceCustomization(customizationStore, productsStore, categoryInfo)
      return
    }

    if (context.hasPersistedCustomization) {
      await restoreExistingCustomization(customizationStore, productsStore)
      return
    }

    await createDefaultCustomization(
      customizationStore,
      productsStore,
      categoryInfo,
      context.hadPersistedWorkflowStep
    )
  }

  // ============================================================================
  // Phase 6: Initialize Localization and Determine Category
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
  // Phase 7: Load Product Data
  // ============================================================================
  // Fetches product previews for the selected category/subcategory.
  const loadProductData = async (
    productsStore: ReturnType<typeof useProductsStore>,
    categoryInfo: CategoryInfo
  ): Promise<void> => {
    await productsStore.fetchProductPreviews(categoryInfo.categoryId, categoryInfo.subCategoryId)
  }

  const syncWorkflowForCategoryAvailability = (
    hasCategories: boolean,
    preserveExistingStep = false
  ): void => {
    if (hasCategories) return

    wf.setSelectedCategoryForPreview(null)
    wf.setSelectedSubCategoryForPreview(null)

    if (preserveExistingStep) {
      if (!wf.activeStep) {
        wf.setActiveStep('product')
      }
      if (wf.activeStep === 'product' && wf.productsSubStep !== 'product') {
        wf.setProductsSubStep('product')
      }
      return
    }

    if (wf.productsSubStep !== 'product') {
      wf.setProductsSubStep('product')
    }

    if (wf.activeStep !== 'product') {
      wf.setActiveStep('product')
    }
  }

  // ============================================================================
  // Phase 8A: Restore Existing Customization
  // ============================================================================
  // Restores user's saved customization and ensures all related data is loaded.
  // Preserves all user changes while syncing with current API state.
  const restoreExistingCustomization = async (
    customizationStore: ReturnType<typeof useCustomizationStore>,
    productsStore: ReturnType<typeof useProductsStore>
  ): Promise<void> => {
    const customization = customizationStore.customization
    if (!customization) return

    const persistedProductId = Number(customization.product_id || 0)
    const persistedStyleId = Number(customization.style_id || 0)
    const persistedDesignId = Number(customization.design_id || 0)

    // Restore product selection
    let productId = persistedProductId

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
      customizationStore.setProduct(productId)
    }

    // Restore style selection
    let styleId = persistedStyleId
    if (styleId > 0) {
      if (productsStore.activeStyleDetails?.id !== styleId) {
        await productsStore.fetchActiveStyleDetails(styleId)
      }
      customizationStore.setStyle(styleId)
    } else {
      // Use default style if none saved
      const defaultStyleId = productsStore.activeStyleDetails?.id
      if (defaultStyleId) {
        customizationStore.setStyle(defaultStyleId)
        styleId = defaultStyleId
      }
    }

    // Restore design selection
    let designId = persistedDesignId
    if (designId > 0) {
      if (productsStore.activeDesignDetails?.id !== designId) {
        await productsStore.fetchDesignDetailsById(designId)
      }
      if (productsStore.activeDesignDetails) {
        void customizationStore.setDesign(productsStore.activeDesignDetails as OutputDesignDetails)
      }
    } else {
      const defaultDesignId = productsStore.activeDesignDetails?.id
      if (defaultDesignId) {
        void customizationStore.setDesign(productsStore.activeDesignDetails as OutputDesignDetails)
        designId = defaultDesignId
      }
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
  // Phase 8B: Create Default Customization
  // ============================================================================
  // Creates a new customization when no saved state exists.
  // Sets up default product, style, and design selections.
  const createDefaultCustomization = async (
    customizationStore: ReturnType<typeof useCustomizationStore>,
    productsStore: ReturnType<typeof useProductsStore>,
    categoryInfo: CategoryInfo,
    preserveWorkflowStep = false
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
    syncWorkflowForCategoryAvailability(hasCategories, preserveWorkflowStep)
  }

  // ============================================================================
  // Phase 8B: Create Default Customization
  // ============================================================================
  // Creates a new customization when no saved state exists.
  // Sets up default product, style, and design selections.
  const createEcommerceCustomization = async (
    customizationStore: ReturnType<typeof useCustomizationStore>,
    productsStore: ReturnType<typeof useProductsStore>,
    categoryInfo: CategoryInfo,
    preserveWorkflowStep = false
  ): Promise<void> => {
    const hasCategories = (productsStore.categories?.data?.length ?? 0) > 0

    // Clear history when starting fresh
    try {
      const history = useHistoryStore()
      history.clear()
    } catch {
      // Ignore errors when clearing history
    }
    const { syncId } = useQueryParams()

    // Determine default product to load
    const syncIdProductId = syncId.value
    if (syncIdProductId) {
      // Load product data
      await productsStore.fetchActiveProductDetails(syncIdProductId, true)
      const activeProductDetailsId: number = productsStore.activeProductDetails?.id ?? 0
      await productsStore.fetchStylePreviews(activeProductDetailsId)

      // Create default customization
      customizationStore.ensureCustomization({
        productId: activeProductDetailsId,
        styleId: productsStore.activeStyleDetails?.id,
        designId: productsStore.activeDesignDetails?.id,
        categoryId: customizationStore.activeCategoryId ?? categoryInfo.categoryId ?? undefined,
        subCategoryId:
          customizationStore.activeSubCategoryId ?? categoryInfo.subCategoryId ?? undefined
      })
      customizationStore.saveToLocalStorage()
    }

    if (!wf.activeStep) {
      wf.setActiveStep('designs')
    }

    syncWorkflowForCategoryAvailability(hasCategories, preserveWorkflowStep)
  }

  // ============================================================================
  // Phase 9: Initialize Workflow Effects
  // ============================================================================
  // Sets up reactive watchers for workflow state changes.
  const initializeWorkflowEffects = (): void => {
    const { initializeEffects } = useWorkflow()
    initializeEffects()
  }

  const reportInitializationError = (phase: InitializationPhase, err: unknown): Error => {
    const normalizedError = err instanceof Error ? err : new Error(String(err))
    const phaseAwareError = new Error(`[${phase}] ${normalizedError.message}`)
    phaseAwareError.stack = normalizedError.stack
    console.error(`App initialization error during ${phase}:`, normalizedError)
    return phaseAwareError
  }

  const executePhase = async <T>(
    phase: InitializationPhase,
    action: () => Promise<T> | T
  ): Promise<T> => {
    try {
      return await action()
    } catch (err) {
      throw reportInitializationError(phase, err)
    }
  }

  const runInitializationPipeline = async (): Promise<void> => {
    await executePhase('sync-query-params', syncQueryParamsIfEmbedded)
    await executePhase('load-app-info', () => {
      appStore.loadAppInfoFromGlobalVariable()
    })
    await executePhase('check-storage-version', () => {
      storage.checkVersion()
    })

    let context: InitializationContext | null = null

    try {
      const pipelineContext = await executePhase(
        'hydrate-persistent-stores',
        hydratePersistentStores
      )
      context = pipelineContext

      await executePhase('fetch-essential-data', () => fetchEssentialData(pipelineContext))
      pipelineContext.categoryInfo = await executePhase('determine-category', () =>
        initializeLocalizationAndCategory(
          pipelineContext.stores.customizationStore,
          pipelineContext.stores.productsStore
        )
      )
      syncWorkflowForCategoryAvailability(
        pipelineContext.hasCategoriesAvailable,
        pipelineContext.hadPersistedWorkflowStep
      )

      const categoryInfo = pipelineContext.categoryInfo ?? { categoryId: null }

      await executePhase('load-product-previews', () =>
        loadProductData(pipelineContext.stores.productsStore, categoryInfo)
      )
      await executePhase('hydrate-customization', () =>
        hydrateCustomizationState(pipelineContext, categoryInfo)
      )
      await executePhase('initialize-workflow-effects', () => {
        initializeWorkflowEffects()
      })
    } finally {
      context?.stores.productsStore.resumeCustomizationAutoSync()
    }
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
        await runInitializationPipeline()

        // Mark as complete
        isInitialized.value = true
        globalIsInitialized = true
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to initialize app'
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
