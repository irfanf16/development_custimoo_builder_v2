<script setup lang="ts">
  import CanvasPreview from '@/components/customizer-canvas-preview/CanvasPreview.vue'
  import BottomActions from '@/components/customizer-bottom-actions/BottomActions.vue'
  import PriceCard from '@/components/customizer-price/PriceCard.vue'
  import { CustomizerMenu } from '@/components/customizer-menu'
  import {
    CategoryPanel,
    MenuPanel,
    ProductPanel,
    DesignsPanel,
    StylesPanel
  } from '@/components/customizer-panel'
  import { Button } from '@/components/ui/button'
  import RightToolbar from '@/components/customizer-canvas-preview/RightToolbar.vue'
  import { ref, watch } from 'vue'
  import { useProductsStore } from '@/stores/products'
  import { CustomizerTopbar } from '@/components/customizer-topbar'
  import SmallPreview from '@/components/customizer-canvas-preview/SmallPreview.vue'

  const productsStore = useProductsStore()

  const currentPanel = ref<'category' | 'product' | 'designs' | 'styles'>(
    'category'
  )

  const panelHistory = ref<string[]>(['category'])

  const navigateToPanel = (
    panel: 'category' | 'product' | 'designs' | 'styles'
  ) => {
    if (panel !== currentPanel.value) {
      panelHistory.value.push(panel)
      currentPanel.value = panel
    }
  }

  const navigateBack = () => {
    if (panelHistory.value.length > 1) {
      panelHistory.value.pop()
      const previousPanel = panelHistory.value[
        panelHistory.value.length - 1
      ] as 'category' | 'product' | 'designs' | 'styles'
      if (previousPanel === 'category') {
        productsStore.clearLastCategoryId()
      }
      currentPanel.value = previousPanel
    }
  }

  const handleCategorySelect = (categoryId: number) => {
    productsStore.setlastCategoryId(categoryId)
    navigateToPanel('product')
  }

  // React to step changes from the menu/store
  watch(
    () => productsStore.activeStep,
    async step => {
      if (step === 'Categories' && currentPanel.value !== 'category') {
        // When returning to categories, snapshot defaults for potential reset later
        productsStore.captureDefaultsSnapshot()
      }
      if (step === 'Designs') {
        // Ensure design previews are available after a reload
        const styleId =
          (productsStore.style as any)?.id || productsStore.activeStyleId
        const needsPreviews = !(
          Array.isArray(productsStore.designPreviews) &&
          productsStore.designPreviews.length > 0
        )
        if (needsPreviews && styleId) {
          await productsStore.dispatchGetDesignPreviewsByStyleId(
            styleId as number
          )
        }
        navigateToPanel('designs')
      } else if (step === 'Styles') {
        const pid =
          (productsStore.product as any)?.id || productsStore.activeProductId
        if (pid && !productsStore.stylePreviews) {
          await productsStore.dispatchGetStylePreviews(pid as number)
          await productsStore.dispatchGetProductAddons(pid as number)
        }
        navigateToPanel('styles')
      } else if (step === 'Categories') {
        navigateToPanel('category')
      } else if (currentPanel.value === 'category') {
        // default after leaving categories is product panel
        navigateToPanel('product')
      }
    },
    { immediate: true }
  )

  // Breadcrumb configuration
  const getBreadcrumbs = () => {
    const step = productsStore.activeStep || 'Categories'
    if (step === 'Categories') {
      if (currentPanel.value === 'category') {
        return [{ label: 'Categories' }]
      }
      const category = productsStore.categories?.data?.find(
        c => c.id === productsStore.lastCategoryId
      )
      return [
        { label: 'Categories', action: () => navigateBack() },
        { label: category?.category_name || 'Products' }
      ]
    }

    if (step === 'Designs') {
      return [{ label: 'Designs' }]
    }

    if (step === 'Styles') {
      const title =
        ((productsStore.product as any)?.display_name as string) || 'Styles'
      return [{ label: title }]
    }

    // Fallback for future steps: single-level breadcrumb
    return [{ label: step }]
  }
</script>

<template>
  <div class="overflow-hidden">
    <CanvasPreview />
    <div id="main-content" class="flex flex-col w-full z-10">
      <div id="top-content" class="flex flex-row justify-between">
        <div id="left-content" class="flex flex-row gap-4">
          <div id="menu-items-container" class="flex-col">
            <CustomizerMenu />
          </div>
          <div id="menu-panel-container" class="flex-col">
            <MenuPanel
              :content-key="currentPanel"
              :breadcrumbs="getBreadcrumbs()"
              :expandable="
                currentPanel !== 'category' && currentPanel !== 'styles'
              "
              :show-back-button="currentPanel !== 'category'"
              :on-back="navigateBack"
            >
              <!-- Category Panel Content -->
              <CategoryPanel
                v-if="currentPanel === 'category'"
                @select-category="handleCategorySelect"
              />

              <!-- Product Panel Content -->
              <ProductPanel v-else-if="currentPanel === 'product'" />

              <!-- Designs Panel Content -->
              <DesignsPanel v-else-if="currentPanel === 'designs'" />

              <!-- Styles Panel Content -->
              <StylesPanel v-else-if="currentPanel === 'styles'" />

              <template #footer="{ isExpanded }">
                <div
                  class="flex gap-3 w-full"
                  :class="isExpanded ? 'justify-end' : 'justify-between'"
                >
                  <Button
                    variant="outline"
                    size="default"
                    class="rounded-lg w-[12.5rem]"
                    >Previous</Button
                  >
                  <Button
                    variant="default"
                    size="default"
                    class="rounded-lg w-[12.5rem]"
                    >Next</Button
                  >
                </div>
              </template>
            </MenuPanel>
          </div>
        </div>
        <div
          id="right-content"
          class="flex flex-col grow justify-between items-end gap-9"
        >
          <CustomizerTopbar />
          <div
            id="canvas-controls-container"
            class="flex flex-col grow items-center w-full h-full"
          >
            <div
              id="canvas-controls-container-inner"
              class="flex flex-col gap-9 items-end justify-between h-full"
            >
              <RightToolbar />
              <SmallPreview />
            </div>
          </div>
        </div>
      </div>
      <div id="bottom-content" class="flex flex-row justify-between items-end">
        <BottomActions />
        <PriceCard />
      </div>
    </div>
  </div>
</template>
