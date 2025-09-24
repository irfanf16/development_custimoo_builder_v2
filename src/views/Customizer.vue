<script setup lang="ts">
  import ProductPreview from '@/components/product-preview/ProductPreview.vue'
  import BottomActions from '@/components/customizer-bottom-actions/BottomActions.vue'
  import PriceCard from '@/components/customizer-price/PriceCard.vue'
  import { CustomizerMenu } from '@/components/customizer-menu'
  import CustomizerMenuMobile from '@/components/customizer-menu/CustomizerMenu.Mobile.vue'
  import { WorkflowLayout } from '@/components/customization-workflow'
  import WorkflowLayoutMobile from '@/components/customization-workflow/WorkflowLayout.Mobile.vue'
  import RightToolbar from '@/components/customizer-canvas-preview/RightToolbar.vue'
  import { CustomizerTopbar } from '@/components/customizer-topbar'
  import SmallPreview from '@/components/customizer-canvas-preview/SmallPreview.vue'
  import MobileActionBar from '@/components/customizer-canvas-preview/MobileActionBar.vue'
  import { computed } from 'vue'
  import { useUIStore } from '@/stores/ui'

  const uiStore = useUIStore()
  // Workflow logic moved to composables
  import { useWorkflowManager, useWorkflowNavigation } from '@/composables'

  const { currentStep, handleCategorySelect } = useWorkflowManager()
  const { navigationItems } = useWorkflowNavigation(currentStep, () => {
    // Navigate back by going to previous step in workflow store
    // This is now handled by the workflow store itself
  })

  const containerWidth = computed(() => uiStore.containerWidth)
  const containerHeight = computed(() => uiStore.containerHeight)
  const isMobile = computed(() => uiStore.isMobile)
</script>

<template>
  <div class="">
    <ProductPreview class="" />
    <div class="absolute w-0 h-0">
      <div
        class="px-4 py-4 md:px-6 md:py-6"
        :style="{
          width: `${containerWidth}px`,
          height: `${containerHeight}px`
        }"
      >
        <div id="main-content overflow-hidden" class="flex flex-col w-full z-0">
          <!-- Desktop layout -->
          <template v-if="!isMobile">
            <div id="top-content" class="flex flex-row justify-between">
              <div id="left-content" class="flex flex-row gap-4">
                <div id="menu-items-container" class="flex-col z-10">
                  <CustomizerMenu />
                </div>
                <WorkflowLayout
                  :current-step="currentStep"
                  :navigation-items="navigationItems"
                  :on-navigate-back="() => {}"
                  :on-category-select="handleCategorySelect"
                  class="z-20"
                />
              </div>

              <div
                id="right-content"
                class="flex flex-col grow justify-between items-end gap-9"
              >
                <CustomizerTopbar class="z-10" />
                <div
                  id="canvas-controls-container"
                  class="flex flex-col grow w-full h-full"
                >
                  <div
                    id="canvas-controls-container-inner"
                    class="flex flex-col gap-9 items-end justify-between h-full mr-[25vw]"
                  >
                    <RightToolbar class="z-10" />
                    <SmallPreview class="z-10" />
                  </div>
                </div>
              </div>
            </div>
            <div
              id="bottom-content"
              class="flex flex-row justify-between items-end"
            >
              <BottomActions class="z-10" />
              <PriceCard class="z-10" />
            </div>
          </template>

          <!-- Mobile layout -->
          <template v-else>
            <div class="flex flex-col gap-2">
              <CustomizerTopbar class="z-10" />
              <CustomizerMenuMobile />
              <WorkflowLayoutMobile
                :current-step="currentStep"
                :on-navigate-back="() => {}"
                :on-category-select="handleCategorySelect"
              />
              <MobileActionBar />
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
