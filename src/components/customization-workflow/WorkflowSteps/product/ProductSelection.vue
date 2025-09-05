<script setup lang="ts">
  import { computed, onMounted, watch, nextTick } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import ProductPreviewCanvas from '../ProductPreviewCanvas.vue'
  import { Button } from '@/components/ui/button'

  const productsStore = useProductsStore()
  const selectionStore = useCustomizationStore()
  const workflowStore = useWorkflowStore()
  const previews = computed(() => productsStore.productPreviews || [])
  const selectedProductId = computed(() => selectionStore.activeProductId)

  interface Emits {
    (
      e: 'scroll-to-element',
      elementId: string,
      behavior?: 'smooth' | 'auto'
    ): void
  }

  const emit = defineEmits<Emits>()

  function loadPreviewsForCurrentCategory() {
    const categoryId =
      workflowStore.selectedCategoryId ?? selectionStore.activeCategoryId
    productsStore.fetchProductPreviews(categoryId)
  }

  onMounted(() => {
    loadPreviewsForCurrentCategory()

    // Scroll to active product if it exists
    nextTick(() => {
      const activeProductId = selectionStore.activeProductId
      if (activeProductId) {
        // Small delay to ensure MenuPanel is fully mounted
        setTimeout(() => {
          emit('scroll-to-element', `product-${activeProductId}`, 'auto')
        }, 100)
      }
    })
  })

  watch(
    () => workflowStore.selectedCategoryId,
    () => {
      loadPreviewsForCurrentCategory()
    }
  )

  async function handleSelectProduct(productId: number) {
    // Commit the selected category/subcategory at the moment the product is chosen
    workflowStore.commitSelectedCategory()
    workflowStore.commitSelectedSubCategory()
    await productsStore.fetchActiveProductDetails(productId)
    // After loading active details, ensure customization contains product, style and design ids
    const styleId = productsStore.activeStyleDetails?.id
    const designId = productsStore.activeDesignDetails?.id
    if (styleId) {
      // Persist chosen style in customization
      selectionStore.setStyle(styleId)
      await productsStore.fetchStylePreviews(productId)
    }
    if (designId && styleId) {
      // Persist chosen design in customization
      selectionStore.setDesign(designId)
      await productsStore.fetchDesignPreviewsByStyleId(styleId)
    }
    // Move step to Designs
    workflowStore.setActiveStep('Designs')
  }
</script>

<template>
  <div class="flex flex-wrap mb-6">
    <div
      v-for="item in previews"
      :key="item.productPreview.id"
      :id="`product-${item.productPreview.id}`"
      class="group relative flex flex-col items-center flex-shrink-0 gap-6 p-6"
      :class="[
        'relative rounded-xl transition-colors cursor-pointer',
        'hover:border-border hover:bg-primary/10 hover:outline-ring',
        selectedProductId === item.productPreview.id ? 'bg-primary/20' : ''
      ]"
      @click="handleSelectProduct(item.productPreview.id)"
    >
      <div
        class="text-base font-medium text-left w-full text-foreground truncate max-w-[176px] overflow-ellipsis leading-none"
      >
        {{ item.productPreview.display_name }}
      </div>
      <div>
        <ProductPreviewCanvas
          :product="item.productPreview"
          :style-base="item.stylePreview"
          :design-base="item.designPreview"
          :width="176"
          :height="176"
          class="rounded-xl"
        />

        <!-- Hover actions -->
        <div
          class="absolute -bottom-[-1rem] left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity"
        >
          <Button
            variant="secondary"
            size="sm"
            class="shadow-sm"
            @click.stop="handleSelectProduct(item.productPreview.id)"
          >
            Product details
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* Product panel specific styles */
</style>
