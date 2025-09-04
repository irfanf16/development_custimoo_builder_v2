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

  interface Emits {
    (e: 'update:isExpanded', value: boolean): void
  }

  const emit = defineEmits<Emits>()

  function selectDesign(item: any) {
    emit('update:isExpanded', false)
    productsStore.applyDesignPreview(item)
  }
</script>

<template>
  <div class="flex flex-wrap mb-6">
    <div
      v-for="item in previews"
      :key="item.id"
      class="group relative flex flex-col items-center flex-shrink-0 gap-6 p-6"
      :class="[
        'relative rounded-xl transition-colors cursor-pointer',
        'hover:border-border hover:bg-primary/10 hover:outline-ring',
        selectedDesignId === item.id ? 'bg-primary/20' : ''
      ]"
      @click="selectDesign(item)"
    >
      <div
        class="text-base font-medium text-left w-full text-foreground truncate max-w-[176px] overflow-ellipsis leading-none"
      >
        {{ item.front_design.design_name }}
      </div>
      <div>
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
