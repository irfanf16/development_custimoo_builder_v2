<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { useProductsStore } from '@/stores/products'
  import ProductPreviewCanvas from '@/components/customizer-panel/ProductPreviewCanvas.vue'

  const productsStore = useProductsStore()

  const previews = computed(() => productsStore.productPreviews || [])

  onMounted(() => {
    if (!productsStore.productPreviews) {
      const categoryId =
        productsStore.lastCategoryId ||
        productsStore.categories?.data?.[0]?.id ||
        null
      productsStore.dispatchGetProductPreviews(categoryId)
    }
  })

  async function handleSelectProduct(productId: number) {
    productsStore.setActiveProduct(productId)
    await productsStore.dispatchGetActiveProductDetails(productId)
  }
</script>

<template>
  <div :class="['flex flex-wrap overflow-y-auto max-h-[640px]']">
    <div
      v-for="item in previews"
      :key="item.product.id"
      class="flex flex-col items-center flex-shrink-0 gap-3 pl-6 pb-6 pt-6"
    >
      <div
        class="text-sm font-medium text-left w-full text-foreground truncate"
      >
        {{ item.product.display_name }}
      </div>
      <ProductPreviewCanvas
        :product="item.product"
        :style-base="item.defaultStyle"
        :design-base="item.defaultDesign"
        class="bg-muted/20 rounded-xl border border-border/50 hover:border-border transition-colors cursor-pointer hover:bg-muted/30"
        @click="handleSelectProduct(item.product.id)"
      />
    </div>
  </div>
</template>

<style scoped>
  /* Product panel specific styles */
</style>
