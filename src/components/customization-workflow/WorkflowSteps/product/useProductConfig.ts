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
import { useProfileStore } from '@/stores/profile/profile.store'
import { useCompanyStore } from '@/stores/company/company.store'
import { buildProductBreadcrumbs } from '@/components/customization-workflow/breadcrumbs'
import {
  products_search_placeholder,
  products_help_select_category,
  products_help_select_subcategory
} from '@/paraglide/messages'

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
  const profileStore = useProfileStore()
  const companyStore = useCompanyStore()
  const hasCategories = computed(() => (productsStore.categories?.data?.length ?? 0) > 0)
  const isAccordionMode = computed(
    () => !!companyStore.settings?.settings?.enable_stepper_navigation
  )

  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => {
    const search = computed<SearchConfiguration | null>(() => {
      if (workflowStore.productsSubStep === 'product') {
        return {
          placeholder: products_search_placeholder({}, { locale: profileStore.currentLocale }),
          onInput: (val: string) => (productSearchModel.value = val)
        }
      }
      return null
    })
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

    const helpText = computed<{ label: string; tooltip?: string } | undefined>(() => {
      if (!hasCategories.value) {
        return undefined
      }
      if (workflowStore.productsSubStep === 'category') {
        return {
          label: products_help_select_category({}, { locale: profileStore.currentLocale })
        }
      }
      if (workflowStore.productsSubStep === 'subcategory') {
        return {
          label: products_help_select_subcategory({}, { locale: profileStore.currentLocale })
        }
      }
      return undefined
    })

    return {
      breadcrumbs: buildProductBreadcrumbs({
        hasCategories: hasCategories.value,
        productsSubStep: workflowStore.productsSubStep,
        categories: productsStore.categories?.data,
        selectedCategoryId: workflowStore.selectedCategoryId,
        activeCategoryId: customizationStore.activeCategoryId,
        selectedSubCategoryId: workflowStore.selectedSubCategoryId,
        activeSubCategoryId: customizationStore.activeSubCategoryId,
        onCategoryStep: () => {
          if (isAccordionMode.value) workflowStore.setSelectedCategoryForPreview(null)
          workflowStore.setProductsSubStep('category')
        },
        onSubCategoryStep: isAccordionMode.value
          ? () => workflowStore.setProductsSubStep('category')
          : () => workflowStore.setProductsSubStep('subcategory'),
        locale: profileStore.currentLocale
      }),
      search: search.value ?? undefined,
      isExpandable: true,
      customizableStockFilter: showCustomizerStockFilter.value
        ? customizableStockFilter.value
        : undefined,
      helpText: helpText.value ?? undefined
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
