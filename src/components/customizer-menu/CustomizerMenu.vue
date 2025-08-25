<script setup lang="ts">
  import CustomizerMenuItem from './MenuItem.vue'
  import { useProductsStore } from '@/stores/products'
  const productsStore = useProductsStore()
  const steps = [
    'Categories',
    'Designs',
    'Styles',
    'Logos',
    'Colors',
    'Patterns',
    'Texts',
    'Roster',
    'Summary'
  ]
  function isActive(label: string) {
    console.log('isActive', label, productsStore.activeStep)
    return (productsStore.activeStep || 'Categories') === label
  }
  async function goTo(label: string) {
    console.log('goTo', label)
    if (label === 'Designs') {
      const styleId = (productsStore.style as any)?.id
      const hasPreviews =
        Array.isArray(productsStore.designPreviews) &&
        productsStore.designPreviews.length > 0
      if (!hasPreviews && styleId) {
        await productsStore.dispatchGetDesignPreviewsByStyleId(styleId)
      }
    } else if (label === 'Styles') {
      const pid =
        (productsStore.product as any)?.id || productsStore.activeProductId
      if (pid) {
        if (!productsStore.stylePreviews) {
          await productsStore.dispatchGetStylePreviews(pid as number)
        }
        // Ensure addons are present
        await productsStore.dispatchGetProductAddons(pid as number)
      }
    }
    productsStore.setActiveStep(label)
  }
</script>

<template>
  <div class="flex flex-col gap-1 p-1">
    <CustomizerMenuItem
      :isActive="isActive('Categories')"
      :text="'Categories'"
      @click="goTo('Categories')"
    >
      <template #icon>
        <i-flex-line-categories class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :isActive="isActive('Designs')"
      :text="'Designs'"
      @click="goTo('Designs')"
    >
      <template #icon>
        <i-flex-line-ai-edit-spark class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :isActive="isActive('Styles')"
      :text="'Styles'"
      @click="goTo('Styles')"
    >
      <template #icon>
        <i-flex-line-ai-sparkles class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :isActive="isActive('Logos')"
      :text="'Logos'"
      @click="goTo('Logos')"
    >
      <template #icon>
        <i-flex-line-landscape1 class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :isActive="isActive('Colors')"
      :text="'Colors'"
      @click="goTo('Colors')"
    >
      <template #icon>
        <i-flex-line-paint-palette class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :isActive="isActive('Patterns')"
      :text="'Patterns'"
      @click="goTo('Patterns')"
    >
      <template #icon>
        <i-flex-line-pattern class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :isActive="isActive('Texts')"
      :text="'Texts'"
      @click="goTo('Texts')"
    >
      <template #icon>
        <i-flex-line-text-style class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :isActive="isActive('Roster')"
      :text="'Roster'"
      @click="goTo('Roster')"
    >
      <template #icon>
        <i-flex-line-table class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem
      :isActive="isActive('Summary')"
      :text="'Summary'"
      @click="goTo('Summary')"
    >
      <template #icon>
        <i-flex-line-text-file class="size-[1.5rem] bg-transparent" />
      </template>
    </CustomizerMenuItem>
  </div>
</template>
