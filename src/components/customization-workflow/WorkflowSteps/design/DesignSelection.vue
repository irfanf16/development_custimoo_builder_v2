<script setup lang="ts">
  import { computed, nextTick, onMounted, ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import ProductPreviewCanvas from '../ProductPreviewCanvas.vue'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useUIStore } from '@/stores/ui/ui.store'

  const uiStore = useUIStore()
  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()

  const { isMobile } = storeToRefs(uiStore)
  const { activeDesignName: selectedDesignName } = storeToRefs(customizationStore)

  interface Emits {
    (e: 'scroll-to-element', elementId: string, behavior?: 'smooth' | 'auto'): void
  }

  const emit = defineEmits<Emits>()

  const previews = computed(() => productsStore.designPreviews || [])
  const designSelectionContainer = ref<HTMLElement | null>(null)
  import {
    designSearchModel,
    applyCustomizationOverrides as headerApplyOverridesModel
  } from './config'
  const applyCustomizationOverrides = headerApplyOverridesModel

  onMounted(async () => {
    if (!productsStore.designPreviews) {
      const styleId = productsStore.activeStyleDetails?.id
      if (styleId) {
        await productsStore.fetchDesignPreviewsByStyleId(styleId)
      }
    }
    // Scroll to active design when component mounts
    nextTick(() => {
      const activeDesignName = customizationStore.customization?.design_name
      if (activeDesignName) {
        // Small delay to ensure WorkflowPanel is fully mounted
        setTimeout(() => {
          emit('scroll-to-element', `design-${activeDesignName}`, 'auto')
        }, 100)
      }
    })
  })

  async function selectDesign(item: import('@/services/products/types').OutputDesignPreviewFront) {
    productsStore.applyDesignPreview(item)
    // Scroll to selected design with smooth animation
    setTimeout(() => {
      emit('scroll-to-element', `design-${item.design_name}`, 'smooth')
    }, 100)
  }

  // Header search config (debounced for perf)
  // const debouncedDesignQuery = computed({
  //   get: () => designSearchModel.value,
  //   set: v => (designSearchModel.value = v)
  // })
  // let designSearchTimeout: number | null = null
  // watch(
  //   debouncedDesignQuery,
  //   (v: string) => {
  //     if (designSearchTimeout) window.clearTimeout(designSearchTimeout)
  //     designSearchTimeout = window.setTimeout(() => {
  //       designSearchModel.value = v.trim().toLowerCase()
  //     }, 150)
  //   },
  //   { immediate: true }
  // )
  const filteredPreviews = computed(() => {
    const q = designSearchModel.value
    if (!q) return previews.value
    return previews.value.filter(d => d.front_design.design_name.toLowerCase().includes(q))
  })

  // header/footer config moved to config.ts

  // Hint to TS that these are used via the template
  void ProductPreviewCanvas
  void filteredPreviews.value
  void selectedDesignName.value
  void designSelectionContainer.value
  void selectDesign
</script>

<template>
  <!-- Content -->
  <div ref="designSelectionContainer" class="flex flex-wrap mb-4 md:mb-6">
    <div
      v-for="item in filteredPreviews"
      :id="`design-${item.design_name}`"
      :key="item.id"
      class="group relative flex flex-col items-center flex-shrink-0 gap-4 md:gap-6 p-4 md:p-6"
      :class="[
        'relative rounded-sm transition-colors cursor-pointer',
        'hover:border-border hover:bg-primary/10 hover:outline-ring',
        selectedDesignName === item.design_name ? 'bg-primary/20' : ''
      ]"
      @click="selectDesign(item)"
    >
      <div
        class="text-base font-medium text-left w-full text-foreground truncate max-w-[145px] overflow-ellipsis leading-none"
      >
        {{ item.front_design.design_name }}
      </div>
      <div>
        <ProductPreviewCanvas
          v-if="productsStore.activeProductDetails && productsStore.activeStyleDetails"
          :product="productsStore.activeProductDetails!"
          :style-base="productsStore.activeStyleDetails!"
          :design-base="item as any"
          :width="isMobile ? 130 : 176"
          :height="isMobile ? 130 : 176"
          :apply-customization-overrides="applyCustomizationOverrides"
          class="rounded-xl"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
