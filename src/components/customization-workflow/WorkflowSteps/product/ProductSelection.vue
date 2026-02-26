<script setup lang="ts">
  import { computed, onMounted, watch, nextTick, onUnmounted, ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useCartStore } from '@/stores/cart/cart.store'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { useAppStore } from '@/stores/app/app.store'
  import { confirmDialog } from '@/lib/confirm-dialog'
  import { Button } from '@/components/ui/button'
  import { Badge } from '@/components/ui/badge'
  import type { OutputDesignDetails } from '@/services/products/types'
  import { useProductConfig } from './useProductConfig'
  import { PRODUCT_TYPE } from './useProductConfig'
  import LazyTwoDScene from '../LazyTwoDScene.vue'
  import { products_product_details, products_product_type_customized } from '@/paraglide/messages'
  import ProductDetailsDialog from '@/components/customizer/ProductDetailsDialog.vue'

  interface Emits {
    (e: 'scroll-to-element', elementId: string, behavior?: 'smooth' | 'auto'): void
  }

  const emit = defineEmits<Emits>()
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const workflowStore = useWorkflowStore()
  const uiStore = useUIStore()
  const profileStore = useProfileStore()
  const cartStore = useCartStore()
  const lockerRoomStore = useLockerRoomStore()

  const { isMobile } = storeToRefs(uiStore)
  const { activeProductId: selectedProductId } = storeToRefs(customizationStore)
  const appStore = useAppStore()
  const { productSearchModel, showCustomizerStockFilter, customizerStockFilterModel } =
    useProductConfig()
  const previews = computed(() => productsStore.productPreviews || [])
  const isDetailsDialogOpen = ref(false)
  const selectedProductIdToPreview = ref<number>(0)
  // Constants
  const SCROLL_DELAY_MS = 100

  async function loadPreviewsForCurrentCategory(isColdStart: boolean = false) {
    // isColdStart is true when the component is mounted without a selected subcategory.
    // For example, when the app loads for the first time or when the user navigates back to the product step.
    const categoryId = workflowStore.selectedCategoryId ?? customizationStore.activeCategoryId
    const subcategoryId = isColdStart
      ? (workflowStore.selectedSubCategoryId ?? null)
      : customizationStore.activeSubCategoryId
    await productsStore.fetchProductPreviews(categoryId, subcategoryId || undefined)
    customizationStore.replicateActiveProductLogosToMatchingPlacements()
  }

  onMounted(() => {
    loadPreviewsForCurrentCategory(true)

    // Scroll to active product if it exists
    nextTick(() => {
      const activeProductId = customizationStore.activeProductId
      if (activeProductId) {
        // Small delay to ensure WorkflowPanel is fully mounted
        setTimeout(() => {
          emit('scroll-to-element', `product-${activeProductId}`, 'auto')
        }, SCROLL_DELAY_MS)
      }
    })
  })

  watch([() => workflowStore.selectedCategoryId, () => workflowStore.selectedSubCategoryId], () => {
    loadPreviewsForCurrentCategory()
  })

  async function handleSelectProduct(productId: number) {
    try {
      // Check if we're in reorder flow and selecting a different product
      if (appStore.isReorderFlow) {
        const currentProductId = customizationStore.activeProductId
        if (currentProductId && currentProductId !== productId) {
          const confirmed = await confirmDialog({
            title: 'Leave Reorder Flow?',
            description:
              'You are in a reorder flow. Do you want to leave and select a different product?',
            confirmText: 'Leave',
            cancelText: 'Cancel'
          })

          if (!confirmed) {
            return
          }
          appStore.setReorderFlow(false)
        } else {
          // Same product, allow selection
          return
        }
      }

      // Check if we're editing a cart or locker product
      const isEditingCartProduct = cartStore.isEditingCartProduct
      const isEditingLockerProduct = lockerRoomStore.isEditingLockerProduct

      if (isEditingCartProduct || isEditingLockerProduct) {
        // Check if trying to change to a different product
        const currentProductId = customizationStore.activeProductId
        if (currentProductId && currentProductId !== productId) {
          const confirmed = await confirmDialog({
            title: 'Leave Editing Mode?',
            description:
              'You are currently editing a product. Changing the product will exit editing mode. Do you want to continue?',
            confirmText: 'Leave Editing',
            cancelText: 'Cancel'
          })

          if (!confirmed) {
            return
          }

          // Clear editing state
          if (isEditingCartProduct) {
            cartStore.clearEditingCartProduct()
          }
          if (isEditingLockerProduct) {
            lockerRoomStore.clearEditingLockerProduct()
          }
        } else {
          // Same product, allow selection
          return
        }
      }

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
        customizationStore.setDesign(productsStore.activeDesignDetails as OutputDesignDetails)
        await productsStore.fetchDesignPreviewsByStyleId(styleId)
      }

      // Move step to Designs
      workflowStore.setActiveStep('designs')
      // Reset all workflow sub-steps to their default values
      workflowStore.resetWorkflowSubSteps()
    } catch (error) {
      console.error('Error selecting product:', error)
      // TODO: Add user-facing error notification
    }
  }

  function handleOpenDetailsDialog(productId: number) {
    selectedProductIdToPreview.value = productId
    isDetailsDialogOpen.value = true
  }

  // Search and filtering
  const filteredPreviews = computed(() => {
    let items = previews.value

    // If filter is shown, apply filter by product_type
    if (showCustomizerStockFilter.value) {
      const filter = customizerStockFilterModel.value
      if (filter !== 'all') {
        items = items.filter(p => p.productPreview.product_type === filter)
      }
    }

    const query = productSearchModel.value.trim().toLowerCase()
    if (!query) return items
    return items.filter(p => p.productPreview.display_name.toLowerCase().includes(query))
  })

  // Determine if both "customized" (bespoke) and "personalized" products exist in previews
  const hasBespokeProducts = computed(() =>
    previews.value?.some(p => p.productPreview.product_type === PRODUCT_TYPE.CUSTOMIZED)
  )
  const hasPersonalizedProducts = computed(() =>
    previews.value?.some(p => p.productPreview.product_type === PRODUCT_TYPE.PERSONALIZED)
  )

  watch(
    [hasBespokeProducts, hasPersonalizedProducts],
    () => {
      showCustomizerStockFilter.value = hasBespokeProducts.value && hasPersonalizedProducts.value
    },
    { immediate: true }
  )

  onUnmounted(() => {
    showCustomizerStockFilter.value = false
    customizerStockFilterModel.value = 'all'
  })
</script>

<template>
  <div class="flex flex-wrap justify-around mb-4 md:mb-6">
    <div
      v-for="item in filteredPreviews"
      :id="`product-${item.productPreview.id}`"
      :key="item.productPreview.id"
      class="group relative flex flex-col items-center flex-shrink-0 gap-4 p-4"
      :class="[
        'relative rounded-sm transition-colors cursor-pointer',
        'hover:border-border hover:bg-primary/10 hover:outline-ring',
        selectedProductId === item.productPreview.id ? 'bg-primary/20' : ''
      ]"
      @click="handleSelectProduct(item.productPreview.id)"
    >
      <div class="flex flex-col gap-2 items-start w-full justify-start">
        <Badge
          v-if="
            showCustomizerStockFilter &&
            item.productPreview.product_type === PRODUCT_TYPE.CUSTOMIZED
          "
          variant="outline"
          class="font-normal self-start"
        >
          {{ products_product_type_customized({}, { locale: profileStore.currentLocale }) }}
        </Badge>
        <span
          v-else-if="
            showCustomizerStockFilter &&
            item.productPreview.product_type === PRODUCT_TYPE.PERSONALIZED
          "
          class="h-5"
        >
        </span>
        <div
          class="text-sm md:text-base font-medium text-left w-full text-foreground truncate max-w-[145px] overflow-ellipsis leading-none self-start"
        >
          {{ item.productPreview.display_name }}
        </div>
      </div>
      <div class="px-2">
        <LazyTwoDScene
          :models="item.stylePreview.front_models"
          :design="item.designPreview.front_design"
          :svg-parts="item.designPreview.svg_parts"
          :canvas-width="isMobile ? 130 : 176"
          :canvas-height="isMobile ? 130 : 176"
          :canvas-class="'rounded-xl'"
          :product-id="item.productPreview.id"
        />

        <!-- Hover actions -->
        <div
          class="absolute -bottom-[-1rem] left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity"
        >
          <Button
            variant="default"
            size="sm"
            class="hover:bg-primary"
            @click.stop="handleOpenDetailsDialog(item.productPreview.id)"
          >
            {{ products_product_details({}, { locale: profileStore.currentLocale }) }}
          </Button>
        </div>
      </div>
    </div>
    <ProductDetailsDialog
      :open="isDetailsDialogOpen"
      :product-id="selectedProductIdToPreview"
      @update:open="isDetailsDialogOpen = $event"
    >
    </ProductDetailsDialog>
  </div>
</template>

<style scoped>
  /* Product panel specific styles */
</style>
