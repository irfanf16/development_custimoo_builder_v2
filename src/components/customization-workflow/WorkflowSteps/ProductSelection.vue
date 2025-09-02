<script setup lang="ts">
  import { computed, onMounted, watch } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import ProductPreviewCanvas from './ProductPreviewCanvas.vue'

  const productsStore = useProductsStore()

  const previews = computed(() => productsStore.productPreviews || [])

  function loadPreviewsForCurrentCategory() {
    const categoryId = productsStore.effectiveCategoryId
    productsStore.dispatchGetProductPreviews(categoryId)
  }

  onMounted(() => {
    loadPreviewsForCurrentCategory()
  })

  watch(
    () => productsStore.effectiveCategoryId,
    () => {
      loadPreviewsForCurrentCategory()
    }
  )

  async function handleSelectProduct(productId: number) {
    // Commit the selected category at the moment the product is chosen
    productsStore.commitSelectedCategory()
    await productsStore.dispatchGetActiveProductDetails(productId)
    // Load design previews for the selected product's default style
    const styleId = (productsStore.activeStyleDetails as any)?.id
    if (styleId) {
      await productsStore.dispatchGetDesignPreviewsByStyleId(styleId)
    }
    // Move step to Designs
    productsStore.setActiveStep('Designs')
  }
</script>

<template>
  <div class="flex flex-wrap overflow-y-auto max-h-[640px] gap-6">
    <div
      v-for="item in previews"
      :key="item.productPreview.id"
      class="flex flex-col items-center flex-shrink-0 gap-3 py-0"
    >
      <div
        class="text-base font-medium text-left w-full text-foreground truncate max-w-[176px] overflow-ellipsis"
      >
        {{ item.productPreview.display_name }}
      </div>
      <ProductPreviewCanvas
        :product="item.productPreview"
        :style-base="item.stylePreview"
        :design-base="item.designPreview"
        :width="176"
        :height="176"
        class="bg-muted/20 rounded-xl border border-border/50 hover:border-border transition-colors cursor-pointer hover:bg-muted/30"
        @click="handleSelectProduct(item.productPreview.id)"
      />
    </div>
  </div>
</template>

<style scoped>
  /* Product panel specific styles */
</style>
