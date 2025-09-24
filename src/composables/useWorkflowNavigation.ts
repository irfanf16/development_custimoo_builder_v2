import { computed, type ComputedRef, type Ref } from 'vue'
import { useProductsStore } from '@/stores/products/products.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import type { WorkflowRouteStep } from '@/components/customization-workflow/types'

export interface NavigationItem {
  label: string
  action?: () => void
  isActive?: boolean
}

export interface UseWorkflowNavigationApi {
  navigationItems: ComputedRef<NavigationItem[]>
}

export function useWorkflowNavigation(
  currentStep: Ref<WorkflowRouteStep>,
  onNavigateBack: () => void
): UseWorkflowNavigationApi {
  // ===== DEPENDENCIES =====
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  // ===== COMPUTED =====
  const navigationItems = computed((): NavigationItem[] => {
    const step = workflowStore.activeStep || 'Categories'
    const hasCategories = !!(
      productsStore.categories?.data && productsStore.categories.data.length
    )
    // If categories exist but step is "Products", normalize to "Categories"
    const normalizedStep =
      step === 'Products' && hasCategories ? 'Categories' : step

    if (!hasCategories && step === 'Products') {
      // No categories available at all
      return [{ label: 'Products' }]
    }

    if (normalizedStep === 'Categories') {
      // Category selection view
      if (currentStep.value === 'category') {
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

      // Subcategory list view
      if (currentStep.value === 'subcategory') {
        const categoryName = category?.category_name || '—'
        return [
          {
            label: 'Category',
            action: () => {
              workflowStore.setProductsSubStep('category')
              workflowStore.setActiveStep('Categories')
            }
          },
          { label: categoryName }
        ]
      }

      // Product selection view
      const hasSubs = !!(
        category &&
        category.subcategories &&
        category.subcategories.length
      )

      // If category has subcategories, breadcrumb should be: Category -> [Subcategory]
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
              workflowStore.setActiveStep('Categories')
            }
          },
          { label: subLabel }
        ]
      }

      // If no subcategories, show: Category -> [Category Name]
      return [
        {
          label: 'Category',
          action: () => {
            workflowStore.setProductsSubStep('category')
            workflowStore.setActiveStep('Categories')
          }
        },
        { label: category?.category_name || '—' }
      ]
    }

    if (normalizedStep === 'Designs') {
      return [{ label: 'Designs' }]
    }

    if (normalizedStep === 'Styles') {
      const title = productsStore.activeProductDetails?.display_name || 'Styles'
      return [{ label: title }]
    }

    if (normalizedStep === 'Logos') {
      const sub = workflowStore.logosSubStep as 'list' | 'placement' | 'edit'
      const map: Record<string, string> = {
        list: 'Logos',
        placement: 'Placement',
        edit: 'Edit'
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

    if (normalizedStep === 'Colors') {
      return [{ label: 'Color' }]
    }

    if (normalizedStep === 'Patterns') {
      const items = [
        { label: 'Pattern', action: onNavigateBack }
      ] as NavigationItem[]
      if (workflowStore.patternsSubStep === 'group') {
        items.push({ label: workflowStore.activePatternGroupName || 'Base' })
      }
      return items
    }

    if (normalizedStep === 'Texts') {
      return [{ label: 'Texts' }]
    }

    if (normalizedStep === 'Roster') {
      return [{ label: 'Roster' }]
    }

    if (normalizedStep === 'Summary') {
      return [{ label: 'Summary' }]
    }

    // Fallback for future steps: single-level navigation
    return [{ label: step }]
  })

  // ===== RETURN =====
  return { navigationItems }
}
