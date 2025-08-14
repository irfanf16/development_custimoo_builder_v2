<script setup lang="ts">
  import CanvasPreview from '@/components/customizer-canvas-preview/CanvasPreview.vue'
  import BottomActions from '@/components/customizer-bottom-actions/BottomActions.vue'
  import PriceCard from '@/components/customizer-price/PriceCard.vue'
  import { CustomizerMenu } from '@/components/customizer-menu'
  import {
    CategoryPanel,
    MenuPanel,
    ProductPanel
  } from '@/components/customizer-panel'
  import RightToolbar from '@/components/customizer-canvas-preview/RightToolbar.vue'
  import { ref } from 'vue'
  import { useProductsStore } from '@/stores/products'
  import { CustomizerTopbar } from '@/components/customizer-topbar'
  import SmallPreview from '@/components/customizer-canvas-preview/SmallPreview.vue'

  const productsStore = useProductsStore()

  const currentPanel = ref<'category' | 'product'>('category')

  const panelHistory = ref<string[]>(['category'])

  const navigateToPanel = (panel: 'category' | 'product') => {
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
      ] as 'category' | 'product'
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

  // Breadcrumb configuration
  const getBreadcrumbs = () => {
    if (currentPanel.value === 'category') {
      return [{ label: 'Categories' }]
    } else {
      const category = productsStore.categories?.data?.find(
        c => c.id === productsStore.lastCategoryId
      )
      return [
        {
          label: 'Categories',
          action: () => navigateBack()
        },
        {
          label: category?.category_name || 'Products'
        }
      ]
    }
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
              :expandable="currentPanel === 'product'"
              :show-back-button="currentPanel === 'product'"
              :on-back="navigateBack"
            >
              <!-- Category Panel Content -->
              <CategoryPanel
                v-if="currentPanel === 'category'"
                @select-category="handleCategorySelect"
              />

              <!-- Product Panel Content -->
              <ProductPanel v-else />
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
