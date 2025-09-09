import { ref, onMounted, readonly } from 'vue'
import { useCompanyStore } from '@/stores/company/company.store'
import { useAuthStore } from '@/stores/auth/auth.store'
import { useProductsStore } from '@/stores/products/products.store.ts'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useLocaleStore } from '@/stores/locale/locale.store'

// Global state to prevent multiple initializations
// This prevents race conditions when multiple components try to initialize the app simultaneously
let globalInitializationPromise: Promise<void> | null = null
let globalIsInitialized = false

export function useAppInitialization() {
  // Local state for this component instance
  const isInitialized = ref(globalIsInitialized)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const initializeApp = async () => {
    // If already initialized globally, just return the cached result
    if (globalIsInitialized) {
      isInitialized.value = true
      return
    }

    // If initialization is already in progress globally, wait for it to complete
    // This prevents multiple simultaneous initialization attempts
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
    // This ensures only one initialization process runs at a time across the entire app
    globalInitializationPromise = (async () => {
      try {
        // PHASE 1: Initialize stores from localStorage (non-blocking operations)
        // These operations can fail without breaking the entire initialization process

        // Initialize authentication state from localStorage
        // This loads any previously saved user session or access tokens
        try {
          const authStore = useAuthStore()
          authStore.initCustomerAndAccessTokenFromLocalStorage()
        } catch (_err) {
          // In rare cases the store may not be available; ignore and continue
          // This prevents authentication issues from blocking app initialization
        }

        // Initialize selection/customization from localStorage
        const productsStore = useProductsStore()
        const customizationStore = useCustomizationStore()
        const hasActiveCustomization = customizationStore.load()
        // restore saved workflow sub-steps
        const { useWorkflowStore } = await import(
          '@/stores/workflow/workflow.store'
        )
        const wf = useWorkflowStore()
        wf.loadWorkflowSubStepsFromLocalStorage()

        // PHASE 2: Fetch essential data from API (blocking operations)
        // These operations must complete before we can proceed with customization setup

        // Fetch company information and settings
        // Company data is required for proper app configuration and localization
        const companyStore = useCompanyStore()
        await Promise.all([
          companyStore.dispatchGetCompany(),
          companyStore.dispatchGetSettings(),
          // Conditionally fetch categories based on whether we have an active category
          // If we have a stored category, fetch products for that category
          // Otherwise, fetch all available categories
          productsStore.fetchCustomizedCategories()
        ])

        // PHASE 3: Initialize localization and determine effective category
        // Locale must be set after company data is loaded since it may depend on company settings

        // Initialize locale store after company data is loaded
        // This sets up the appropriate language and regional settings
        const localeStore = useLocaleStore()
        localeStore.initializeLocale()

        // Determine the effective category ID for loading products
        // Priority order: stored category > first available category > null
        const effectiveCategoryId =
          customizationStore.activeCategoryId ||
          productsStore.categories?.data?.[0]?.id ||
          null

        // Set the active category in customization state if we have one
        // This ensures the customization state reflects the current category selection
        // if (effectiveCategoryId) {
        //   customizationStore.setCategory(effectiveCategoryId)
        // }

        // PHASE 4: Load product data and set up customization state

        // Load product previews for the ProductPanel
        // These are lightweight previews that show available products in the selected category
        await productsStore.fetchProductPreviews(effectiveCategoryId)

        // PHASE 5: Set up product customization state
        // This is the core of the initialization process - ensuring we have a valid product selection

        if (hasActiveCustomization) {
          // SCENARIO A: Restore from stored customization by fetching dependent details
          const apc = customizationStore.customization
          if (apc) {
            // Step 0: Load style previews
            await productsStore.fetchStylePreviews(apc.product_id)

            // Step 1: Load product details (loads default style + design)
            await productsStore.fetchActiveProductDetails(
              Number(apc.product_id)
            )

            // Step 2: Load explicit style if different from default
            if (
              customizationStore.activeStyleId &&
              apc.style_id !== customizationStore.activeStyleId
            ) {
              await productsStore.fetchActiveStyleDetails(apc.style_id)
            }

            // Step 3: Load explicit design if different from current
            if (
              customizationStore.activeDesignId &&
              apc.design_id !== customizationStore.activeDesignId
            ) {
              await productsStore.fetchDesignDetailsById(apc.design_id)
            }
          }
        } else {
          // SCENARIO B: Create default customization but navigate to category selection
          // User is new or has no saved customization, set up sensible defaults

          // Determine which product to load as default
          // Priority order: stored product ID > first product in category > null
          const activeProductId =
            customizationStore.activeProductId ||
            (productsStore.productPreviews &&
            productsStore.productPreviews.length
              ? productsStore.productPreviews[0].productPreview.id
              : null)

          if (activeProductId != null) {
            // Load the default product details (includes default style and design)
            // Step 0: Load style previews
            await productsStore.fetchStylePreviews(activeProductId)

            // Step 1: Load product details (loads default style + design)
            await productsStore.fetchActiveProductDetails(activeProductId)

            // Ensure we have a default customization set up
            // This creates a customization object with the default product, style, and design
            if (!customizationStore.customization) {
              customizationStore.ensureCustomization()
              customizationStore.save()
            }
          }

          // On initialization, check for activeStep in localStorage and set the active step accordingly.
          // If not found, fall back to Categories (if available) or Products.
          const storedActiveStep = localStorage.getItem('activeStep')
          if (storedActiveStep) {
            wf.setActiveStep(storedActiveStep)
          } else if (
            effectiveCategoryId &&
            productsStore.categories?.data?.length
          ) {
            wf.setActiveStep('Categories')
          } else {
            wf.setActiveStep('Products')
          }
        }

        // PHASE 6: Mark initialization as complete
        // Set both local and global flags to prevent re-initialization

        isInitialized.value = true
        globalIsInitialized = true
      } catch (err) {
        // Handle any errors during initialization
        // This prevents the app from getting stuck in a loading state
        error.value =
          err instanceof Error ? err.message : 'Failed to initialize app'
      } finally {
        // Clean up loading state and global promise
        // This ensures the initialization can be retried if needed
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
