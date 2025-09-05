<script setup lang="ts">
  import { computed, nextTick, onMounted, ref } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import ProductPreviewCanvas from '../ProductPreviewCanvas.vue'
  import { useSelectionStore } from '@/stores/selection.store'

  const selectionStore = useSelectionStore()

  const productsStore = useProductsStore()

  const previews = computed(() => productsStore.designPreviews || [])
  const selectedDesignId = computed(
    () => (selectionStore as any).activeDesignId
  )

  const designSelectionContainer = ref<HTMLElement | null>(null)

  onMounted(async () => {
    if (!productsStore.designPreviews) {
      const styleId = (productsStore.activeStyleDetails as any)?.id
      if (styleId) {
        await productsStore.dispatchGetDesignPreviewsByStyleId(styleId)
      }
    }
    // Scroll to active design when component mounts
    nextTick(() => {
      const activeDesignId = (selectionStore as any).customization?.design_id
      if (activeDesignId) {
        // Small delay to ensure MenuPanel is fully mounted
        setTimeout(() => {
          emit('scroll-to-element', `design-${activeDesignId}`, 'auto')
        }, 100)
      }
    })
  })

  interface Emits {
    (e: 'update:isExpanded', value: boolean): void
    (
      e: 'scroll-to-element',
      elementId: string,
      behavior?: 'smooth' | 'auto'
    ): void
  }

  const emit = defineEmits<Emits>()

  async function selectDesign(item: any) {
    console.log('selectDesign', item)
    emit('update:isExpanded', false)
    productsStore.applyDesignPreview(item)
    // Scroll to selected design with smooth animation
    setTimeout(() => {
      emit('scroll-to-element', `design-${item.id}`, 'smooth')
    }, 300)
  }
</script>

<template>
  <div ref="designSelectionContainer" class="flex flex-wrap mb-6">
    <div
      v-for="item in previews"
      :key="item.id"
      :id="`design-${item.id}`"
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
