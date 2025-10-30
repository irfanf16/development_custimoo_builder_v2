import { ref, computed, type Ref } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useProductsStore } from '@/stores/products/products.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'

export const productSearchModel: Ref<string> = ref('')

const workflowStore = useWorkflowStore()
const productsStore = useProductsStore()
const customizationStore = useCustomizationStore()

export const productHeaderConfig = computed<HeaderConfiguration>(() => {
  // Build product breadcrumbs using the same logic previously in workflow.store.ts (navigationItems)
  if (workflowStore.activeStep !== 'product') {
    return {
      search: {
        placeholder: 'Search products...',
        onInput: (val: string) => (productSearchModel.value = val)
      },
      isExpandable: true
    }
  }

  const trail: { label: string; action?: () => void }[] = []

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
    search: {
      placeholder: 'Search products...',
      onInput: (val: string) => (productSearchModel.value = val)
    },
    isExpandable: true
  }
})
export const productFooterConfig: FooterConfiguration = { buttons: [] }
