<script setup lang="ts">
  import { computed } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useSelectionStore } from '@/stores/selection.store.ts'
  import { useLocaleStore } from '@/stores/locale/locale.store'

  interface NavigationItem {
    label: string
    action?: () => void
    isActive?: boolean
  }

  interface Props {
    currentStep:
      | 'category'
      | 'subcategory'
      | 'product'
      | 'designs'
      | 'styles'
      | 'logos'
      | 'colors'
      | 'patterns'
      | 'patterns-group'
      | 'texts'
      | 'texts-placement'
      | 'roster'
      | 'roster-edit'
      | 'summary'
    onNavigateBack: () => void
  }

  const props = defineProps<Props>()

  const productsStore = useProductsStore()
  const selectionStore = useSelectionStore()
  useLocaleStore()

  // Navigation configuration for the customization workflow
  const navigationItems = computed((): NavigationItem[] => {
    const step = selectionStore.activeStep || 'Categories'
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
        selectionStore.selectedCategoryId ?? selectionStore.activeCategoryId
      const category = productsStore.categories?.data?.find(
        c => c.id === categoryIdForTrail
      )
      const subId =
        selectionStore.selectedSubCategoryId ??
        selectionStore.activeSubCategoryId

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
            selectionStore.setProductsSubStep('category')
            selectionStore.setActiveStep('Categories')
          }
        },
        {
          label: category?.category_name || '—',
          action: hasSubs
            ? () => {
                selectionStore.setProductsSubStep('subcategory')
                selectionStore.setActiveStep('Categories')
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
      const title =
        ((productsStore.activeProductDetails as any)?.display_name as string) ||
        'Styles'
      return [{ label: title }]
    }

    if (normalizedStep === 'Logos') {
      const sub = (productsStore as any).logosSubStep as
        | 'list'
        | 'placement'
        | 'edit'
      const map: Record<string, string> = {
        list: 'Logos',
        placement: 'Placement',
        edit: 'Edit'
      }
      const trail = [
        {
          label: 'Logos',
          action: () => {
            selectionStore.setLogosSubStep('list')
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
      if ((productsStore as any).patternsSubStep === 'group') {
        items.push({
          label: (productsStore as any).activePatternGroupName || 'Base'
        })
      }
      return items
    }

    if (normalizedStep === 'Texts') {
      const items = [{ label: 'Texts' }] as NavigationItem[]
      if ((productsStore as any).textsSubStep === 'placement') {
        items.push({ label: 'Placement' })
      }
      return items
    }

    if (normalizedStep === 'Roster') {
      const items = [{ label: 'Roster' }] as NavigationItem[]
      if ((productsStore as any).rosterSubStep === 'edit') {
        items.push({ label: 'Edit' })
      }
      return items
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
