<script setup lang="ts">
  import { ref } from 'vue'
  import CustomizerMenu from '@/components/customizer-menu/index.vue'
  import {
    MenuPanel,
    CategoryPanel,
    ProductPanel
  } from '@/components/customizer-panel'
  import RightToolbar from '@/components/customizer-toolbar/RightToolbar.vue'
  import BottomActions from '@/components/customizer-bottom-actions/BottomActions.vue'
  import PriceCard from '@/components/customizer-price/PriceCard.vue'
  import CustomizerTopbar from '@/components/customizer-topbar/index.vue'
  import { useProductsStore } from '@/stores/products'

  const productsStore = useProductsStore()

  // Panel state management
  const currentPanel = ref<'category' | 'product'>('category')
  const panelHistory = ref<string[]>(['category'])

  // Clear any existing category selection on mount to start with Category panel
  productsStore.clearLastCategoryId()

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

  const handleCategorySelect = (categoryId: number) => {
    productsStore.setlastCategoryId(categoryId)
    navigateToPanel('product')
  }
</script>

<template>
  <div class="relative w-full h-full flex-1 flex flex-col">
    <!-- Top Right controls -->
    <div class="absolute right-4 top-4 z-20 hidden md:block">
      <CustomizerTopbar />
    </div>

    <div class="relative flex-row gap-4 w-full h-full flex-1">
      <!-- Mini left icon rail -->
      <div class="pt-4 relative z-40 h-full">
        <CustomizerMenu />
        <!-- Unified Menu Panel positioned out of flow, next to the menu -->
        <div class="absolute left-[72px] top-4 w-[360px] min-w-[360px] h-full">
          <div class="h-full relative">
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
      </div>

      <!-- Placeholder div to maintain layout space for the panel column -->
      <div class="w-[360px] pt-4"></div>

      <!-- Canvas area -->
      <div class="relative z-0 h-full overflow-hidden flex-1">
        <!-- Preview layer (kept behind toolbars/menus) -->
        <div
          class="absolute inset-0 z-0 grid place-items-center pointer-events-none"
        >
          <div class="h-[816px] rounded-[32px] grid place-items-center">
            <div class="w-[715px] flex flex-col items-center">
              <img
                class="w-[715px] h-[817px] object-cover select-none"
                src="https://placehold.co/715x817"
                alt="t-shirt"
              />
              <div
                class="w-96 h-4 bg-black/80 rounded-full blur-xl -mt-6"
              ></div>
            </div>
          </div>
        </div>

        <!-- Right toolbar inside canvas area -->
        <div class="absolute right-[25%] top-24 z-10">
          <RightToolbar />
        </div>
      </div>
    </div>

    <!-- Bottom actions + price card -->
    <div
      class="absolute bottom-6 left-0 right-0 px-6 flex items-end justify-between gap-4 z-20"
    >
      <BottomActions />
      <PriceCard />
    </div>
  </div>
</template>

<style>
  /* Breadcrumb item animations (kept here if needed elsewhere) */
  .breadcrumb-item-enter-active,
  .breadcrumb-item-leave-active {
    transition: all 200ms ease;
  }

  .breadcrumb-item-enter-from {
    opacity: 0;
    transform: translateY(-2px);
  }

  .breadcrumb-item-leave-to {
    opacity: 0;
    transform: translateY(2px);
  }
</style>
