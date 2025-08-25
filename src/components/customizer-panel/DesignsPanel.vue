<script setup lang="ts">
  import { computed } from 'vue'
  import { useProductsStore } from '@/stores/products'
  import ProductPreviewCanvas from '@/components/customizer-panel/ProductPreviewCanvas.vue'

  const productsStore = useProductsStore()
  const previews = computed(() => productsStore.designPreviews || [])

  function selectDesign(item: any) {
    productsStore.applyDesignPreview(item)
  }
</script>

<template>
  <div class="flex flex-wrap overflow-y-auto max-h-[640px]">
    <div
      v-for="item in previews"
      :key="item.id"
      class="flex flex-col items-center flex-shrink-0 gap-3 pl-6 pb-6 pt-6"
    >
      <div
        class="text-sm font-medium text-left w-full text-foreground truncate"
      >
        {{ item.front_design.design_name }}
      </div>
      <ProductPreviewCanvas
        :product="{ ...productsStore.product, display_name: '' } as any"
        :style-base="productsStore.style as any"
        :design-base="item"
        class="bg-muted/20 rounded-xl border border-border/50 hover:border-border transition-colors cursor-pointer hover:bg-muted/30"
        @click="selectDesign(item)"
      />
    </div>
  </div>
</template>

<style scoped></style>
