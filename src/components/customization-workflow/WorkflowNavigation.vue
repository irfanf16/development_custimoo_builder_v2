<script setup lang="ts">
  import { computed } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useLocaleStore } from '@/stores/locale/locale.store'

  interface NavigationItem {
    label: string
    action?: () => void
    isActive?: boolean
  }

  import type { WorkflowRouteStep } from './types'
  interface Props {
    currentStep: WorkflowRouteStep
    onNavigateBack: () => void
  }

  const props = defineProps<Props>()

  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  useLocaleStore()

  // Navigation configuration for the customization workflow
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
      if (props.currentStep === 'category') {
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
      if (props.currentStep === 'subcategory') {
        return [
          { label: 'Category', action: props.onNavigateBack },
          { label: category?.category_name || '—' }
        ]
      }

      // Product selection view
      const hasSubs = !!(
        category &&
        category.subcategories &&
        category.subcategories.length
      )
      const trail: NavigationItem[] = [
        {
          label: 'Category',
          action: () => {
            workflowStore.setProductsSubStep('category')
            workflowStore.setActiveStep('Categories')
          }
        },
        {
          label: category?.category_name || '—',
          action: hasSubs
            ? () => {
                workflowStore.setProductsSubStep('subcategory')
                workflowStore.setActiveStep('Categories')
              }
            : undefined
        }
      ]
      if (category && subId) {
        const sub = category.subcategories?.find(s => s.id === subId)
        if (sub) trail.push({ label: sub.category_name })
      }
      return trail
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
        { label: 'Pattern', action: props.onNavigateBack }
      ] as NavigationItem[]
      if (workflowStore.patternsSubStep === 'group') {
        items.push({
          label: workflowStore.activePatternGroupName || 'Base'
        })
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

  // Expose computed navigation items
  defineExpose({
    navigationItems
  })
</script>

<template>
  <!-- This component doesn't render anything, it just manages navigation logic -->
</template>
