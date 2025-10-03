<script setup lang="ts">
  import { computed } from 'vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useLocaleStore } from '@/stores/locale/locale.store'
  import CustomizerMenuItem from './MenuItem.vue'
  import type { CustomizerStep } from '@/stores/workflow/workflow.store.types'
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

  const workflow = useWorkflowStore()
  const products = useProductsStore()
  const locale = useLocaleStore()

  const NAV = {
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

  const shouldShowCategories = computed(
    () => !!(products.categories?.data && products.categories.data.length > 0)
  )

  function getNavText(step: string) {
    const l = locale.currentLocale
    switch (step) {
      case NAV.PRODUCTS:
        return nav_product({}, { locale: l })
      case NAV.DESIGNS:
        return nav_design({}, { locale: l })
      case NAV.STYLES:
        return nav_style({}, { locale: l })
      case NAV.LOGOS:
        return nav_logo({}, { locale: l })
      case NAV.COLORS:
        return nav_color({}, { locale: l })
      case NAV.PATTERNS:
        return nav_pattern({}, { locale: l })
      case NAV.TEXTS:
        return nav_text({}, { locale: l })
      case NAV.ROSTER:
        return nav_roster({}, { locale: l })
      case NAV.SUMMARY:
        return nav_summary({}, { locale: l })
      default:
        return step
    }
  }

  function isActive(label: string) {
    return (workflow.activeStep || NAV.PRODUCTS) === label
  }

  function getStepFromLabel(label: string): CustomizerStep {
    switch (label) {
      case NAV.PRODUCTS:
        return 'product'
      case NAV.DESIGNS:
        return 'designs'
      case NAV.STYLES:
        return 'styles'
      case NAV.LOGOS:
        return 'logos'
      case NAV.COLORS:
        return 'colors'
      case NAV.PATTERNS:
        return 'patterns'
      case NAV.TEXTS:
        return 'texts'
      case NAV.ROSTER:
        return 'roster'
      case NAV.SUMMARY:
        return 'summary'
      default:
        return 'product'
    }
  }

  async function goTo(label: string) {
    // Toggle panel if tapping current label again
    if ((workflow.activeStep || NAV.PRODUCTS) === label) {
      workflow.togglePanel()
      return
    }

    // Normal navigation
    workflow.setActiveStep(getStepFromLabel(label))
    workflow.setPanelOpen(true)
  }
</script>

<template>
  <div class="flex items-stretch justify-between gap-2 p-2">
    <CustomizerMenuItem
      v-if="shouldShowCategories"
      :is-active="isActive(NAV.PRODUCTS)"
      :text="getNavText(NAV.PRODUCTS)"
      @click="goTo(NAV.PRODUCTS)"
    >
      <template #icon>
        <i-flex-line-categories class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>

    <CustomizerMenuItem
      :is-active="isActive(NAV.DESIGNS)"
      :text="getNavText(NAV.DESIGNS)"
      @click="goTo(NAV.DESIGNS)"
    >
      <template #icon>
        <i-flex-line-ai-edit-spark class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>

    <CustomizerMenuItem
      :is-active="isActive(NAV.STYLES)"
      :text="getNavText(NAV.STYLES)"
      @click="goTo(NAV.STYLES)"
    >
      <template #icon>
        <i-flex-line-ai-sparkles class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>

    <CustomizerMenuItem
      :is-active="isActive(NAV.LOGOS)"
      :text="getNavText(NAV.LOGOS)"
      @click="goTo(NAV.LOGOS)"
    >
      <template #icon>
        <i-flex-line-landscape1 class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>

    <CustomizerMenuItem
      :is-active="isActive(NAV.COLORS)"
      :text="getNavText(NAV.COLORS)"
      @click="goTo(NAV.COLORS)"
    >
      <template #icon>
        <i-flex-line-paint-palette class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
  </div>
</template>

<style scoped></style>
