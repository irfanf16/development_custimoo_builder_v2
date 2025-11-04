import { ref, computed, type Ref } from 'vue'
import type {
  HeaderConfiguration,
  FooterConfiguration,
  SearchConfiguration,
  CustomizableStockFilterConfiguration
} from '../../types'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useProductsStore } from '@/stores/products/products.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'

// Constants
export const PRODUCT_TYPE = {
  CUSTOMIZED: 'customized',
  PERSONALIZED: 'personalized'
} as const

export type StockFilterOption = 'all' | 'customized' | 'personalized'

// Shared state
export const productSearchModel: Ref<string> = ref('')
export const showCustomizerStockFilter: Ref<boolean> = ref(false)
export const customizerStockFilterModel: Ref<StockFilterOption> = ref('all')

// Store instances (Pinia stores are singletons, safe to initialize at module level)
const workflowStore = useWorkflowStore()
const productsStore = useProductsStore()
const customizationStore = useCustomizationStore()

export const productHeaderConfig = computed<HeaderConfiguration>(() => {
  // Build product breadcrumbs using the same logic previously in workflow.store.ts (navigationItems)

  const search = computed<SearchConfiguration | null>(() => {
    if (workflowStore.productsSubStep === 'product') {
      return {
        placeholder: 'Search products...',
        onInput: (val: string) => (productSearchModel.value = val)
      }
    }
    return null
  })
  const trail: { label: string; action?: () => void }[] = []

  const customizableStockFilter = computed<CustomizableStockFilterConfiguration | undefined>(() => {
    return {
      activeFilter: customizerStockFilterModel.value,
      onFilterChange: (filter: StockFilterOption) => {
        customizerStockFilterModel.value = filter
      }
    }
  })

  if (workflowStore.productsSubStep === 'category') {
    trail.push({ label: 'Category' })
  } else {
    const categoryIdForTrail =
      workflowStore.selectedCategoryId ?? customizationStore.activeCategoryId ?? null
    const category = productsStore.categories?.data?.find(c => c.id === categoryIdForTrail)
    const subId =
      workflowStore.selectedSubCategoryId ?? customizationStore.activeSubCategoryId ?? null

    if (workflowStore.productsSubStep === 'subcategory') {
      trail.push({
        label: 'Category',
        action: () => workflowStore.setProductsSubStep('category')
      })
      trail.push({ label: category?.category_name || '—' })
    } else {
      // productsSubStep === 'product'
      trail.push({
        label: 'Category',
        action: () => workflowStore.setProductsSubStep('category')
      })

      const hasSubs = !!(category && category.subcategories && category.subcategories.length)
      const categoryLabel = category?.category_name || '—'
      if (categoryLabel) {
        trail.push({
          label: categoryLabel,
          action: hasSubs ? () => workflowStore.setProductsSubStep('subcategory') : undefined
        })
      }

      if (hasSubs) {
        const selectedSub =
          subId && category ? category.subcategories?.find(s => s.id === subId) : undefined
        if (selectedSub) {
          trail.push({ label: selectedSub.category_name })
        }
      }
    }
  }

  return {
    breadcrumbs: trail,
    search: search.value ?? undefined,
    isExpandable: true,
    customizableStockFilter: showCustomizerStockFilter.value
      ? customizableStockFilter.value
      : undefined
  }
})
export const productFooterConfig: FooterConfiguration = { buttons: [] }
