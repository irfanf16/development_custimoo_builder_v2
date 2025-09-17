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

  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const localeStore = useLocaleStore()

  // Navigation constants - these should not be translated
  const NAV_STEPS = {
    PRODUCTS: 'Products',
    DESIGNS: 'Designs',
    STYLES: 'Styles',
    LOGOS: 'Logos',
    COLORS: 'Colors',
    PATTERNS: 'Patterns',
    TEXTS: 'Texts',
    ROSTER: 'Roster',
    SUMMARY: 'Summary'
  } as const

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

  function isActive(label: string) {
    // Handle the case when no categories are available
    if (!shouldShowCategories.value && label === NAV_STEPS.PRODUCTS) {
      return false
    }
    if (
      !shouldShowCategories.value &&
      (workflowStore.activeStep || NAV_STEPS.PRODUCTS) === NAV_STEPS.PRODUCTS
    ) {
      // If no categories but step is 'Categories', treat it as 'Designs' step
      return label === NAV_STEPS.DESIGNS
    }

    // Check if we're in Products-related substeps
    if (label === NAV_STEPS.PRODUCTS) {
      const currentStep = workflowStore.activeStep || NAV_STEPS.PRODUCTS
      const productsSubStep = workflowStore.productsSubStep

      // Highlight Products if we're in Categories step or any Products substep
      return (
        currentStep === 'Categories' ||
        currentStep === NAV_STEPS.PRODUCTS ||
        (currentStep === 'Categories' &&
          productsSubStep &&
          ['category', 'subcategory', 'product'].includes(productsSubStep))
      )
    }

    // Check if we're in Logos-related substeps
    if (label === NAV_STEPS.LOGOS) {
      const currentStep = workflowStore.activeStep || NAV_STEPS.PRODUCTS
      const logosSubStep = workflowStore.logosSubStep

      // Highlight Logos if we're in Logos step and have a substep
      return (
        currentStep === NAV_STEPS.LOGOS &&
        logosSubStep &&
        ['list', 'placement', 'edit'].includes(logosSubStep)
      )
    }

    // Check if we're in Patterns-related substeps
    if (label === NAV_STEPS.PATTERNS) {
      const currentStep = workflowStore.activeStep || NAV_STEPS.PRODUCTS
      const patternsSubStep = workflowStore.patternsSubStep

      // Highlight Patterns if we're in Patterns step and have a substep
      return (
        currentStep === NAV_STEPS.PATTERNS &&
        patternsSubStep &&
        ['list', 'group'].includes(patternsSubStep)
      )
    }

    return (workflowStore.activeStep || NAV_STEPS.PRODUCTS) === label
  }

  async function goTo(label: string) {
    console.log('goTo', label)

    // If no categories are available and trying to go to Categories, go to Designs instead
    if (label === NAV_STEPS.PRODUCTS && !shouldShowCategories.value) {
      label = NAV_STEPS.DESIGNS
    }

    if (label === NAV_STEPS.DESIGNS) {
      const styleId = productsStore.activeStyleDetails?.id
      const hasPreviews =
        Array.isArray(productsStore.designPreviews) &&
        productsStore.designPreviews.length > 0
      if (!hasPreviews && styleId) {
        await productsStore.fetchDesignPreviewsByStyleId(styleId)
      }
    } else if (label === NAV_STEPS.STYLES) {
      const pid = productsStore.activeProductDetails?.id || null
      if (pid) {
        if (!productsStore.stylePreviews) {
          await productsStore.fetchStylePreviews(pid as number)
        }
      }
    } else if (label === NAV_STEPS.LOGOS) {
      // Prefetch recent logos
      if (!productsStore.recentLogos) {
        // To be implemented
        // await productsStore.fetchRecentLogos()
      }
    } else if (label === NAV_STEPS.COLORS) {
      // Set step directly; colors lives inside product details
    } else if (label === NAV_STEPS.PATTERNS) {
      // Ensure we start at the patterns list
      workflowStore.setPatternsSubStep('list')
    } else if (label === NAV_STEPS.TEXTS) {
      // Text substep management would go here if implemented
    } else if (label === NAV_STEPS.ROSTER) {
      // Roster substep management would go here if implemented
    }
    workflowStore.setActiveStep(label)
  }

  // Helper function to get translated text for a navigation step
  function getNavText(step: string) {
    switch (step) {
      case NAV_STEPS.PRODUCTS:
        return nav_product({}, { locale: localeStore.currentLocale })
      case NAV_STEPS.DESIGNS:
        return nav_design({}, { locale: localeStore.currentLocale })
      case NAV_STEPS.STYLES:
        return nav_style({}, { locale: localeStore.currentLocale })
      case NAV_STEPS.LOGOS:
        return nav_logo({}, { locale: localeStore.currentLocale })
      case NAV_STEPS.COLORS:
        return nav_color({}, { locale: localeStore.currentLocale })
      case NAV_STEPS.PATTERNS:
        return nav_pattern({}, { locale: localeStore.currentLocale })
      case NAV_STEPS.TEXTS:
        return nav_text({}, { locale: localeStore.currentLocale })
      case NAV_STEPS.ROSTER:
        return nav_roster({}, { locale: localeStore.currentLocale })
      case NAV_STEPS.SUMMARY:
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
      :isActive="isActive(NAV_STEPS.PRODUCTS)"
      :text="getNavText(NAV_STEPS.PRODUCTS)"
      @click="goTo(NAV_STEPS.PRODUCTS)"
    >
      <template #icon>
        <i-flex-line-categories class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :isActive="isActive(NAV_STEPS.DESIGNS)"
      :text="getNavText(NAV_STEPS.DESIGNS)"
      @click="goTo(NAV_STEPS.DESIGNS)"
    >
      <template #icon>
        <i-flex-line-ai-edit-spark class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      v-if="shouldShowStyles"
      :isActive="isActive(NAV_STEPS.STYLES)"
      :text="getNavText(NAV_STEPS.STYLES)"
      @click="goTo(NAV_STEPS.STYLES)"
    >
      <template #icon>
        <i-flex-line-ai-sparkles class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :isActive="isActive(NAV_STEPS.LOGOS)"
      :text="getNavText(NAV_STEPS.LOGOS)"
      @click="goTo(NAV_STEPS.LOGOS)"
    >
      <template #icon>
        <i-flex-line-landscape1 class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :isActive="isActive(NAV_STEPS.COLORS)"
      :text="getNavText(NAV_STEPS.COLORS)"
      @click="goTo(NAV_STEPS.COLORS)"
    >
      <template #icon>
        <i-flex-line-paint-palette class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :isActive="isActive(NAV_STEPS.PATTERNS)"
      :text="getNavText(NAV_STEPS.PATTERNS)"
      @click="goTo(NAV_STEPS.PATTERNS)"
    >
      <template #icon>
        <i-flex-line-pattern class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :isActive="isActive(NAV_STEPS.TEXTS)"
      :text="getNavText(NAV_STEPS.TEXTS)"
      @click="goTo(NAV_STEPS.TEXTS)"
    >
      <template #icon>
        <i-flex-line-text-style class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :isActive="isActive(NAV_STEPS.ROSTER)"
      :text="getNavText(NAV_STEPS.ROSTER)"
      @click="goTo(NAV_STEPS.ROSTER)"
    >
      <template #icon>
        <i-flex-line-table class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :isActive="isActive(NAV_STEPS.SUMMARY)"
      :text="getNavText(NAV_STEPS.SUMMARY)"
      @click="goTo(NAV_STEPS.SUMMARY)"
    >
      <template #icon>
        <i-flex-line-text-file class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
  </div>
</template>
