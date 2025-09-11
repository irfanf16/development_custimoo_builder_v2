<script setup lang="ts">
  import { computed, nextTick, onMounted, ref } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import ProductPreviewCanvas from '../ProductPreviewCanvas.vue'
  import { useCustomizationStore } from '@/stores/customization/customization.store'

  interface Emits {
    (
      e: 'scroll-to-element',
      elementId: string,
      behavior?: 'smooth' | 'auto'
    ): void
  }

  const emit = defineEmits<Emits>()
  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()

  const previews = computed(() => productsStore.designPreviews || [])
  const selectedDesignId = computed(() => customizationStore.activeDesignId)
  const designSelectionContainer = ref<HTMLElement | null>(null)
  const applyCustomizationOverrides = ref(false)
  // Mark used via template
  void applyCustomizationOverrides

  onMounted(async () => {
    if (!productsStore.designPreviews) {
      const styleId = productsStore.activeStyleDetails?.id
      if (styleId) {
        await productsStore.fetchDesignPreviewsByStyleId(styleId)
      }
    }
    // Scroll to active design when component mounts
    nextTick(() => {
      const activeDesignId = customizationStore.customization?.design_id
      if (activeDesignId) {
        // Small delay to ensure WorkflowPanel is fully mounted
        setTimeout(() => {
          emit('scroll-to-element', `design-${activeDesignId}`, 'auto')
        }, 100)
      }
    })
  })

  async function selectDesign(
    item: import('@/services/products/types').OutputDesignPreview
  ) {
    console.log('selectDesign', item)
    productsStore.applyDesignPreview(item)
    // Scroll to selected design with smooth animation
    setTimeout(() => {
      emit('scroll-to-element', `design-${item.id}`, 'smooth')
    }, 300)
  }

  // Breadcrumb logic for design selection
  const breadcrumbs = computed(() => [{ label: 'Designs' }])

  // Expose to parent
  defineExpose({ breadcrumbs })

  // Hint to TS that these are used via the template
  void ProductPreviewCanvas
  void previews
  void selectedDesignId
  void designSelectionContainer
  void selectDesign
</script>

<template>
  <!-- Content -->
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
          v-if="
            productsStore.activeProductDetails &&
            productsStore.activeStyleDetails &&
            productsStore.activeDesignDetails
          "
          :product="productsStore.activeProductDetails!"
          :style-base="productsStore.activeStyleDetails!"
          :design-base="item"
          :width="176"
          :height="176"
          :apply-customization-overrides="applyCustomizationOverrides"
          class="rounded-xl"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
