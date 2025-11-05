import { ref, computed } from 'vue'
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

// ===== SHARED STATE =====
// These refs are shared across all component instances
const productSearchModel = ref('')
const showCustomizerStockFilter = ref(false)
const customizerStockFilterModel = ref<StockFilterOption>('all')

export function useProductConfig() {
  // ===== DEPENDENCIES =====
  const workflowStore = useWorkflowStore()
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()

  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => {
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

    const customizableStockFilter = computed<CustomizableStockFilterConfiguration | undefined>(
      () => {
        return {
          activeFilter: customizerStockFilterModel.value,
          onFilterChange: (filter: StockFilterOption) => {
            customizerStockFilterModel.value = filter
          }
        }
      }
    )

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

  const footerConfig = computed<FooterConfiguration>(() => {
    return { buttons: [] }
  })

  // ===== RETURN =====
  return {
    // State
    productSearchModel,
    showCustomizerStockFilter,
    customizerStockFilterModel,
    // Computed
    headerConfig,
    footerConfig
  }
}
