<script setup lang="ts">
  import CanvasPreview from '@/components/customizer-canvas-preview/canvas-preview.vue'
  import BottomActions from '@/components/customizer-bottom-actions/BottomActions.vue'
  import PriceCard from '@/components/customizer-price/PriceCard.vue'
  import CustomizerMenu from '@/components/customizer-menu/index.vue'
  import {
    CategoryPanel,
    MenuPanel,
    ProductPanel
  } from '@/components/customizer-panel'
  import { ref } from 'vue'
  import { useProductsStore } from '@/stores/products'

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
  <div>
    <CanvasPreview />
    <div id="main-content" class="flex-col w-full z-10 border border-red-500">
      <div id="top-content" class="flex-row border border-blue-500">
        <div id="left-content" class="flex flex-row border border-yellow-500">
          <div
            id="menu-items-container"
            class="flex-col border border-pink-500"
          >
            <CustomizerMenu />
          </div>
          <div
            id="menu-panel-container"
            class="flex-col border border-green-500"
          >
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
        <div id="right-content" class="flex-row border border-purple-500">
          <div
            id="canvas-controls-container"
            class="flex-col borderborder-orange-500"
          >
            <RightToolbar />
          </div>
        </div>
      </div>
      <div
        id="bottom-content"
        class="flex flex-row justify-between p-6 border border-green-500 h-[153px]"
      >
        <BottomActions />
        <PriceCard />
      </div>
    </div>
  </div>
</template>
