<script setup lang="ts">
  import { computed } from 'vue'
  import CustomizerMenuItem from './MenuItem.vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import {
    nav_categories,
    nav_designs,
    nav_styles,
    nav_logos,
    nav_colors,
    nav_patterns,
    nav_texts,
    nav_roster,
    nav_summary
  } from '@/paraglide/messages'
  import { useLocaleStore } from '@/stores/locale/locale.store'

  const productsStore = useProductsStore()
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
      (productsStore.companyAddons && productsStore.companyAddons.length) ||
      (productsStore.productAddons && productsStore.productAddons.length)
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
      (productsStore.activeStep || NAV_STEPS.PRODUCTS) === NAV_STEPS.PRODUCTS
    ) {
      // If no categories but step is 'Categories', treat it as 'Designs' step
      return label === NAV_STEPS.DESIGNS
    }
    return (productsStore.activeStep || NAV_STEPS.PRODUCTS) === label
  }

  async function goTo(label: string) {
    console.log('goTo', label)

    // If no categories are available and trying to go to Categories, go to Designs instead
    if (label === NAV_STEPS.PRODUCTS && !shouldShowCategories.value) {
      label = NAV_STEPS.DESIGNS
    }

    if (label === NAV_STEPS.DESIGNS) {
      const styleId = (productsStore.activeStyleDetails as any)?.id
      const hasPreviews =
        Array.isArray(productsStore.designPreviews) &&
        productsStore.designPreviews.length > 0
      if (!hasPreviews && styleId) {
        await productsStore.dispatchGetDesignPreviewsByStyleId(styleId)
      }
    } else if (label === NAV_STEPS.STYLES) {
      const pid =
        (productsStore.activeProductDetails as any)?.id ||
        productsStore.activeProductId
      if (pid) {
        if (!productsStore.stylePreviews) {
          await productsStore.dispatchGetStylePreviews(pid as number)
        }
        // Ensure addons are present
        await productsStore.dispatchGetProductAddons(pid as number)
      }
    } else if (label === NAV_STEPS.LOGOS) {
      // Prefetch recent logos
      if (!productsStore.recentLogos) {
        await productsStore.dispatchGetRecentLogos()
      }
    }
    productsStore.setActiveStep(label)
  }

  // Helper function to get translated text for a navigation step
  function getNavText(step: string) {
    switch (step) {
      case NAV_STEPS.PRODUCTS:
        return nav_categories({}, { locale: localeStore.currentLocale })
      case NAV_STEPS.DESIGNS:
        return nav_designs({}, { locale: localeStore.currentLocale })
      case NAV_STEPS.STYLES:
        return nav_styles({}, { locale: localeStore.currentLocale })
      case NAV_STEPS.LOGOS:
        return nav_logos({}, { locale: localeStore.currentLocale })
      case NAV_STEPS.COLORS:
        return nav_colors({}, { locale: localeStore.currentLocale })
      case NAV_STEPS.PATTERNS:
        return nav_patterns({}, { locale: localeStore.currentLocale })
      case NAV_STEPS.TEXTS:
        return nav_texts({}, { locale: localeStore.currentLocale })
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
