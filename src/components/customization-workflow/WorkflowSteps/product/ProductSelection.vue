<script setup lang="ts">
  import { computed, onMounted, watch, nextTick, ref } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import ProductPreviewCanvas from '../ProductPreviewCanvas.vue'
  import { Button } from '@/components/ui/button'
  import type {
    HeaderAndFooterConfiguration,
    BreadcrumbItem
  } from '../../types'
  import type { OutputDesignDetails } from '@/services/products/types'

  interface Emits {
    (
      e: 'scroll-to-element',
      elementId: string,
      behavior?: 'smooth' | 'auto'
    ): void
  }

  const emit = defineEmits<Emits>()
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const workflowStore = useWorkflowStore()
  const previews = computed(() => productsStore.productPreviews || [])
  const selectedProductId = computed(() => customizationStore.activeProductId)

  function loadPreviewsForCurrentCategory() {
    const categoryId =
      workflowStore.selectedCategoryId ?? customizationStore.activeCategoryId
    productsStore.fetchProductPreviews(categoryId)
  }

  onMounted(() => {
    loadPreviewsForCurrentCategory()

    // Scroll to active product if it exists
    nextTick(() => {
      const activeProductId = customizationStore.activeProductId
      if (activeProductId) {
        // Small delay to ensure WorkflowPanel is fully mounted
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
      customizationStore.setStyle(styleId)
      await productsStore.fetchStylePreviews(productId)
    }
    if (designId && styleId) {
      // Persist chosen design in customization
      customizationStore.setDesign(
        productsStore.activeDesignDetails as OutputDesignDetails
      )
      await productsStore.fetchDesignPreviewsByStyleId(styleId)
    }
    // Move step to Designs
    workflowStore.setActiveStep('Designs')
  }

  // Breadcrumb logic for product selection
  const breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const categoryId =
      workflowStore.selectedCategoryId ?? customizationStore.activeCategoryId
    const category = productsStore.categories?.data?.find(
      c => c.id === categoryId
    )
    const subId =
      workflowStore.selectedSubCategoryId ??
      customizationStore.activeSubCategoryId

    const hasSubs = !!(
      category &&
      category.subcategories &&
      category.subcategories.length
    )

    const trail = [
      {
        label: 'Category',
        action: () => {
          workflowStore.setProductsSubStep('category')
          workflowStore.setActiveStep('Categories')
        }
      },
      {
        label: category?.category_name || '—',
        action: hasSubs
          ? () => {
              workflowStore.setProductsSubStep('subcategory')
              workflowStore.setActiveStep('Categories')
            }
          : undefined
      }
    ]

    if (category && subId) {
      const sub = category.subcategories?.find(s => s.id === subId)
      if (sub)
        trail.push({
          label: sub.category_name,
          action: undefined
        })
    }

    return trail
  })

  // Header search config
  const productSearchQuery = ref('')
  const debouncedProductModel = computed({
    get: () => productSearchQuery.value,
    set: v => (productSearchQuery.value = v)
  })
  let productSearchTimeout: number | null = null
  const productQuery = ref('')
  watch(
    debouncedProductModel,
    v => {
      if (productSearchTimeout) window.clearTimeout(productSearchTimeout)
      productSearchTimeout = window.setTimeout(() => {
        productQuery.value = v.trim().toLowerCase()
      }, 150)
    },
    { immediate: true }
  )
  const filteredPreviews = computed(() => {
    const q = productQuery.value
    if (!q) return previews.value
    return previews.value.filter(p =>
      p.productPreview.display_name.toLowerCase().includes(q)
    )
  })

  const headerAndFooterConfiguration: HeaderAndFooterConfiguration = {
    headerExtras: {
      breadcrumbs,
      search: {
        placeholder: 'Search products...',
        model: debouncedProductModel,
        onInput: (val: string) => (debouncedProductModel.value = val)
      },
      isExpandable: true
    }
  }

  defineExpose(headerAndFooterConfiguration)
</script>

<template>
  <div class="flex flex-wrap mb-6">
    <div
      v-for="item in filteredPreviews"
      :key="item.productPreview.id"
      :id="`product-${item.productPreview.id}`"
      class="group relative flex flex-col items-center flex-shrink-0 gap-6 p-6"
      :class="[
        'relative rounded-sm transition-colors cursor-pointer',
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
          :apply-customization-overrides="false"
          class="rounded-xl"
        />

        <!-- Hover actions -->
        <div
          class="absolute -bottom-[-1rem] left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity"
        >
          <Button
            variant="outline"
            size="sm"
            class="bg-card"
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
