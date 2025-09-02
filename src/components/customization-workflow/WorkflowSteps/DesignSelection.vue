<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import ProductPreviewCanvas from './ProductPreviewCanvas.vue'

  const productsStore = useProductsStore()

  const previews = computed(() => productsStore.designPreviews || [])
  const selectedDesignId = computed(() => productsStore.activeDesignId)

  onMounted(() => {
    if (!productsStore.designPreviews) {
      const styleId = (productsStore.activeStyleDetails as any)?.id
      if (styleId) {
        productsStore.dispatchGetDesignPreviewsByStyleId(styleId)
      }
    }
  })

  function selectDesign(item: any) {
    productsStore.applyDesignPreview(item)
  }
</script>

<template>
  <div class="flex flex-wrap overflow-y-auto max-h-[640px] pb-2 gap-6">
    <div
      v-for="item in previews"
      :key="item.id"
      class="group relative flex flex-col items-center flex-shrink-0 gap-3 py-6"
    >
      <div
        class="text-sm font-medium text-left w-full text-foreground truncate"
      >
        {{ item.front_design.design_name }}
      </div>
      <div
        :class="[
          'relative rounded-xl border transition-colors cursor-pointer',
          'bg-muted/20 border-border/50 hover:border-border hover:bg-muted/30',
          selectedDesignId === item.id ? 'ring-2 ring-ring/50 bg-muted/40' : ''
        ]"
        @click="selectDesign(item)"
      >
        <ProductPreviewCanvas
          :product="productsStore.activeProductDetails as any"
          :style-base="productsStore.activeStyleDetails as any"
          :design-base="item"
          :width="176"
          :height="176"
          class="rounded-xl"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
