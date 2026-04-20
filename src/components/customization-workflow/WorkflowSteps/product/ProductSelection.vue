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
  import { toast } from 'vue-sonner'
  import {
    products_product_details,
    products_product_type_customized,
    msg_no_products_found
  } from '@/paraglide/messages'
  import ProductDetailsDialog from '@/components/customizer/ProductDetailsDialog.vue'
  import { SkeletonBox } from '@/components/skeleton'
  import axios from 'axios'

  interface Emits {
    (e: 'scroll-to-element', elementId: string, behavior?: 'smooth' | 'auto'): void
  }

  defineProps<{
    isExpanded?: boolean
  }>()

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
  const { pendingProductId } = storeToRefs(workflowStore)
  const appStore = useAppStore()
  const { productSearchModel, showCustomizerStockFilter, customizerStockFilterModel } =
    useProductConfig()
  const previews = computed(() => productsStore.productPreviews || [])
  /** Show spinner only when loading and we have no content (new category); keep showing grid when refetching same category. */
  const showProductsLoading = computed(
    () =>
      productsStore.isLoading &&
      (productsStore.productPreviews == null || productsStore.productPreviews.length === 0)
  )
  const isDetailsDialogOpen = ref(false)
  const selectedProductIdToPreview = ref<number>(0)
  // Constants
  const SCROLL_DELAY_MS = 100
  const PRODUCT_SKELETON_PLACEHOLDER_COUNT = 4

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
          customizationStore.clearReorderData()
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

      //commneted this because we have added deduplication to the api requests
      // if (pendingProductId.value != null) {
      //   return
      // }

      // Commit the selected category/subcategory at the moment the product is chosen
      workflowStore.commitSelectedCategory()
      workflowStore.commitSelectedSubCategory()
      // Navigate immediately; load details and previews in the background
      workflowStore.setPendingProductId(productId)

      void (async () => {
        productsStore.setMainPreviewLoadComplete(false)
        try {
          const result = await productsStore.fetchActiveProductDetails(productId)

          if (axios.isCancel(result.axiosError)) {
            return
          }
        } catch (error) {
          console.error('Error selecting product:', error)
          productsStore.setMainPreviewLoadComplete(true)
          return
        } finally {
          if (workflowStore.pendingProductId === productId) {
            workflowStore.setPendingProductId(null)
          }
        }

        const styleId = productsStore.activeStyleDetails?.id
        const designId = productsStore.activeDesignDetails?.id
        if (!styleId) {
          productsStore.setMainPreviewLoadComplete(true)
          return
        }

        try {
          customizationStore.setStyle(styleId)
          await productsStore.fetchStylePreviews(productId)

          if (designId && styleId) {
            customizationStore.setDesign(productsStore.activeDesignDetails as OutputDesignDetails)
            await productsStore.fetchDesignPreviewsByStyleId(styleId)
          }
        } catch (error) {
          console.error('Error loading style/design previews after product select:', error)
        } finally {
          productsStore.setMainPreviewLoadComplete(true)
        }
      })()
    } catch (error) {
      console.error('Error selecting product:', error)
    }
  }

  function handleOpenDetailsDialog(productId: number) {
    selectedProductIdToPreview.value = productId
    isDetailsDialogOpen.value = true
  }

  // 1. Filter the raw previews list based on the customized/personalized toggle
  const availablePreviews = computed(() => {
    let items = previews.value
    if (showCustomizerStockFilter.value) {
      const filter = customizerStockFilterModel.value
      if (filter !== 'all') {
        items = items.filter(p => p.productPreview.product_type === filter)
      }
    }
    return items
  })

  // 2. Compute search matches based on the toggled list
  const searchMatches = computed(() => {
    const query = productSearchModel.value.trim().toLowerCase()
    if (!query) return null
    return availablePreviews.value.filter(p =>
      p.productPreview.display_name.toLowerCase().includes(query)
    )
  })

  // 3. Status flag for the toast watcher
  const isSearchNoResults = computed(() => {
    return (
      !!searchMatches.value &&
      searchMatches.value.length === 0 &&
      availablePreviews.value.length > 0
    )
  })

  // 4. Final list to display in the UI (with fallback to all products)
  const filteredPreviews = computed(() => {
    if (!searchMatches.value || searchMatches.value.length === 0) {
      return availablePreviews.value
    }
    return searchMatches.value
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

  watch(isSearchNoResults, noResults => {
    if (noResults) {
      toast.error(msg_no_products_found({}, { locale: profileStore.currentLocale }), {
        id: 'product-search-no-results',
        position: 'top-right',
        richColors: true,
        duration: 3000
      })
    } else {
      toast.dismiss('product-search-no-results')
    }
  })

  onUnmounted(() => {
    showCustomizerStockFilter.value = false
    customizerStockFilterModel.value = 'all'
  })
</script>

<template>
  <div
    v-if="showProductsLoading"
    :class="
      isExpanded
        ? 'grid [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]'
        : 'flex flex-wrap gap-2'
    "
    class="w-full min-h-[200px]"
    aria-busy="true"
    aria-label="Loading products"
  >
    <div
      v-for="n in PRODUCT_SKELETON_PLACEHOLDER_COUNT"
      :key="`product-skeleton-${n}`"
      class="pointer-events-none relative flex flex-1 flex-col items-center gap-2 rounded-sm p-2 md:gap-3 md:p-2"
    >
      <div class="flex w-full min-w-0 flex-col self-stretch items-center">
        <SkeletonBox :width="isMobile ? 130 : 176" :height="16" radius="sm" />
      </div>
      <div class="flex flex-col items-center gap-3 px-2">
        <SkeletonBox
          class="shrink-0"
          :width="isMobile ? 130 : 176"
          :height="isMobile ? 130 : 176"
          radius="xl"
        />
        <SkeletonBox :width="120" :height="32" radius="md" />
      </div>
    </div>
  </div>
  <div
    v-else
    :class="
      isExpanded
        ? 'grid [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]'
        : 'flex flex-wrap gap-2'
    "
  >
    <div
      v-for="item in filteredPreviews"
      :id="`product-${item.productPreview.id}`"
      :key="item.productPreview.id"
      class="group relative flex flex-col items-center flex-1 gap-4 md:gap-6 p-2 md:p-2"
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
          class="text-sm md:text-base font-medium text-left w-full text-foreground truncate max-w-[180px] overflow-ellipsis leading-none self-start"
        >
          {{ item.productPreview.display_name }}
        </div>
      </div>
      <div class="px-2">
        <div class="relative inline-flex rounded-xl">
          <div class="rounded-xl">
            <LazyTwoDScene
              :models="item.stylePreview.front_models"
              :design="item.designPreview.front_design"
              :svg-parts="item.designPreview.svg_parts"
              :canvas-width="isMobile ? 130 : 176"
              :canvas-height="isMobile ? 130 : 176"
              :canvas-class="'rounded-xl'"
              :product-id="item.productPreview.id"
            />
          </div>
        </div>

        <!-- Same layout as before; only opacity/pointer-events fixed so button is tappable on touch (no hover) -->
        <div
          class="absolute -bottom-[-1rem] left-1/2 -translate-x-1/2 opacity-100 pointer-events-auto transition-opacity"
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
