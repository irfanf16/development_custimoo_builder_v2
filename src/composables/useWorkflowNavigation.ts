import { computed, type ComputedRef } from 'vue'
import { useProductsStore } from '@/stores/products/products.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'

export interface NavigationItem {
  label: string
  action?: () => void
  isActive?: boolean
}

export interface UseWorkflowNavigationApi {
  navigationItems: ComputedRef<NavigationItem[]>
}

export function useWorkflowNavigation(
  _onNavigateBack?: () => void
): UseWorkflowNavigationApi {
  // ===== DEPENDENCIES =====
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  // ===== COMPUTED =====
  const navigationItems = computed((): NavigationItem[] => {
    const step = workflowStore.activeStep || 'product'

    if (step === 'product') {
      if (workflowStore.productsSubStep === 'category') {
        return [{ label: 'Category' }]
      }

      const categoryIdForTrail =
        workflowStore.selectedCategoryId ?? customizationStore.activeCategoryId
      const category = productsStore.categories?.data?.find(
        c => c.id === categoryIdForTrail
      )
      const subId =
        workflowStore.selectedSubCategoryId ??
        customizationStore.activeSubCategoryId

      if (workflowStore.productsSubStep === 'subcategory') {
        return [
          {
            label: 'Category',
            action: () => {
              workflowStore.setProductsSubStep('category')
            }
          },
          { label: category?.category_name || '—' }
        ]
      }

      const hasSubs = !!(
        category &&
        category.subcategories &&
        category.subcategories.length
      )

      if (hasSubs) {
        const selectedSub =
          category && subId
            ? category.subcategories?.find(s => s.id === subId)
            : undefined
        const subLabel = selectedSub?.category_name || 'Subcategory'
        return [
          {
            label: 'Category',
            action: () => {
              workflowStore.setProductsSubStep('category')
            }
          },
          { label: subLabel }
        ]
      }

      return [
        {
          label: 'Category',
          action: () => {
            workflowStore.setProductsSubStep('category')
          }
        },
        { label: category?.category_name || '—' }
      ]
    }

    if (step === 'designs') {
      return [{ label: 'Designs' }]
    }

    if (step === 'styles') {
      const title = productsStore.activeProductDetails?.display_name || 'Styles'
      return [{ label: title }]
    }

    if (step === 'logos') {
      const sub = workflowStore.logosSubStep as 'list' | 'placement' | 'edit'
      const map: Record<string, string> = {
        list: 'Logos',
        placement: 'Placement',
        edit: 'Controls'
      }
      const trail = [
        {
          label: 'Logos',
          action: () => {
            workflowStore.setLogosSubStep('list')
          }
        }
      ]
      if (sub && sub !== 'list')
        trail.push({ label: map[sub] || 'Logos', action: () => {} })
      return trail
    }

    if (step === 'colors') {
      return [{ label: 'Color' }]
    }

    if (step === 'patterns') {
      return [{ label: 'Pattern' }]
    }

    if (step === 'texts') {
      return [{ label: 'Texts' }]
    }

    if (step === 'roster') {
      return [{ label: 'Roster' }]
    }

    if (step === 'summary') {
      return [{ label: 'Summary' }]
    }

    // Fallback for future steps: single-level navigation
    return [{ label: step }]
  })

  // ===== RETURN =====
  return { navigationItems }
}
