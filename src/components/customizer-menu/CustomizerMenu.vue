<script setup lang="ts">
  import { computed } from 'vue'
  import CustomizerMenuItem from './MenuItem.vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import {
    nav_product,
    nav_design,
    nav_style,
    nav_logo,
    nav_color,
    nav_pattern,
    nav_text,
    nav_roster,
    nav_summary
  } from '@/paraglide/messages'
  import { useLocaleStore } from '@/stores/locale/locale.store'
  import type { CustomizerStep } from '@/stores/workflow/workflow.store.types'

  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const localeStore = useLocaleStore()

  // Determine if we should show Categories step based on available categories
  const shouldShowCategories = computed(() => {
    return (
      productsStore.categories?.data && productsStore.categories.data.length > 0
    )
  })

  // Styles visibility: show if more than one style OR addons available
  const shouldShowStyles = computed(() => {
    const stylesCount = (productsStore.stylePreviews || []).length
    const hasAddons = !!(
      (productsStore.activeProductDetails?.company_addons &&
        productsStore.activeProductDetails?.company_addons.length) ||
      (productsStore.activeProductDetails?.product_addons &&
        productsStore.activeProductDetails?.product_addons.length)
    )
    return stylesCount > 1 || hasAddons
  })

  function isActive(label: CustomizerStep) {
    // Handle the case when no categories are available
    if (!shouldShowCategories.value && label === 'product') {
      return false
    }
    if (label === 'product') {
      const currentStep = workflowStore.activeStep || 'product'
      if (currentStep !== 'product') return false
      const sub = workflowStore.productsSubStep
      return ['category', 'subcategory', 'product'].includes(sub || 'category')
    }

    // Check if we're in Logos-related substeps
    if (label === 'logos') {
      const currentStep = workflowStore.activeStep || 'product'
      const logosSubStep = workflowStore.logosSubStep

      // Highlight Logos if we're in Logos step and have a substep
      return (
        currentStep === 'logos' &&
        logosSubStep &&
        ['list', 'placement', 'edit'].includes(logosSubStep)
      )
    }

    // Check if we're in Patterns-related substeps
    if (label === 'patterns') {
      const currentStep = workflowStore.activeStep || 'product'
      return currentStep === 'patterns'
    }

    return (workflowStore.activeStep || 'product') === label
  }

  async function goTo(nextStep: CustomizerStep) {
    if (nextStep === 'designs') {
      const styleId = productsStore.activeStyleDetails?.id
      const hasPreviews =
        Array.isArray(productsStore.designPreviews) &&
        productsStore.designPreviews.length > 0
      if (!hasPreviews && styleId) {
        await productsStore.fetchDesignPreviewsByStyleId(styleId)
      }
    } else if (nextStep === 'styles') {
      const pid = productsStore.activeProductDetails?.id || null
      if (pid) {
        if (!productsStore.stylePreviews) {
          await productsStore.fetchStylePreviews(pid as number)
        }
      }
    } else if (nextStep === 'logos') {
      // Prefetch recent logos is done in useWorkflowEffects
    } else if (nextStep === 'colors') {
      // Set step directly; colors lives inside product details
    } else if (nextStep === 'patterns') {
      // Ensure we start at the patterns list
      workflowStore.setPatternsSubStep('list')
    } else if (nextStep === 'texts') {
      // Text substep management would go here if implemented
    } else if (nextStep === 'roster') {
      // Roster substep management would go here if implemented
    }
    workflowStore.setActiveStep(nextStep)
  }

  // Helper function to get translated text for a navigation step
  function getNavText(step: string) {
    switch (step) {
      case 'product':
        return nav_product({}, { locale: localeStore.currentLocale })
      case 'designs':
        return nav_design({}, { locale: localeStore.currentLocale })
      case 'styles':
        return nav_style({}, { locale: localeStore.currentLocale })
      case 'logos':
        return nav_logo({}, { locale: localeStore.currentLocale })
      case 'colors':
        return nav_color({}, { locale: localeStore.currentLocale })
      case 'patterns':
        return nav_pattern({}, { locale: localeStore.currentLocale })
      case 'texts':
        return nav_text({}, { locale: localeStore.currentLocale })
      case 'roster':
        return nav_roster({}, { locale: localeStore.currentLocale })
      case 'summary':
        return nav_summary({}, { locale: localeStore.currentLocale })
      default:
        return step
    }
  }
</script>

<template>
  <div class="flex flex-col gap-1 p-1">
    <!-- Only show Categories step when categories are available -->
    <CustomizerMenuItem
      v-if="shouldShowCategories"
      :is-active="isActive('product')"
      :text="getNavText('product')"
      @click="goTo('product')"
    >
      <template #icon>
        <i-flex-line-categories class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :is-active="isActive('designs')"
      :text="getNavText('designs')"
      @click="goTo('designs')"
    >
      <template #icon>
        <i-flex-line-ai-edit-spark class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      v-if="shouldShowStyles"
      :is-active="isActive('styles')"
      :text="getNavText('styles')"
      @click="goTo('styles')"
    >
      <template #icon>
        <i-flex-line-ai-sparkles class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :is-active="isActive('logos')"
      :text="getNavText('logos')"
      @click="goTo('logos')"
    >
      <template #icon>
        <i-flex-line-landscape1 class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :is-active="isActive('colors')"
      :text="getNavText('colors')"
      @click="goTo('colors')"
    >
      <template #icon>
        <i-flex-line-paint-palette class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :is-active="isActive('patterns')"
      :text="getNavText('patterns')"
      @click="goTo('patterns')"
    >
      <template #icon>
        <i-flex-line-pattern class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :is-active="isActive('texts')"
      :text="getNavText('texts')"
      @click="goTo('texts')"
    >
      <template #icon>
        <i-flex-line-text-style class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :is-active="isActive('roster')"
      :text="getNavText('roster')"
      @click="goTo('roster')"
    >
      <template #icon>
        <i-flex-line-table class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :is-active="isActive('summary')"
      :text="getNavText('summary')"
      @click="goTo('summary')"
    >
      <template #icon>
        <i-flex-line-text-file class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
  </div>
</template>
