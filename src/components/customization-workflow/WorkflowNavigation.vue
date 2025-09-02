<script setup lang="ts">
  import { computed } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useLocaleStore } from '@/stores/locale/locale.store'
  import { m } from '@/paraglide/messages'

  interface NavigationItem {
    label: string
    action?: () => void
    isActive?: boolean
  }

  interface Props {
    currentStep: 'category' | 'product' | 'designs' | 'styles' | 'logos'
    onNavigateBack: () => void
  }

  const props = defineProps<Props>()

  const productsStore = useProductsStore()
  const localeStore = useLocaleStore()

  // Navigation configuration for the customization workflow
  const navigationItems = computed((): NavigationItem[] => {
    const step = productsStore.activeStep || 'Categories'

    if (step === 'Products') {
      // When no categories are available, show just "Products"
      return [{ label: 'Products' }]
    }

    if (step === 'Categories') {
      if (props.currentStep === 'category') {
        return [
          { label: m.nav_categories({}, { locale: localeStore.currentLocale }) }
        ]
      }
      const category = productsStore.categories?.data?.find(
        c => c.id === productsStore.activeCategoryId
      )
      return [
        { label: 'Categories', action: props.onNavigateBack },
        { label: category?.category_name || 'Products' }
      ]
    }

    if (step === 'Designs') {
      return [{ label: 'Designs' }]
    }

    if (step === 'Styles') {
      const title =
        ((productsStore.activeProductDetails as any)?.display_name as string) ||
        'Styles'
      return [{ label: title }]
    }

    if (step === 'Logos') {
      const sub = (productsStore as any).logosSubStep as
        | 'list'
        | 'placement'
        | 'controls'
        | 'editor'
      const map: Record<string, string> = {
        list: 'Logos',
        placement: 'Placement',
        controls: 'Controls',
        editor: 'Editor'
      }
      const trail = [
        {
          label: 'Logos',
          action: () => {
            productsStore.setLogosSubStep('list')
          }
        }
      ]
      if (sub && sub !== 'list')
        trail.push({ label: map[sub] || 'Logos', action: () => {} })
      return trail
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
