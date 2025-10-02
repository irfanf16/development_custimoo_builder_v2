<script setup lang="ts">
  import ProductPreview from '@/components/product-preview/ProductPreview.vue'
  import { CustomizerMenu } from '@/components/customizer-menu'
  import CustomizerMenuMobile from '@/components/customizer-menu/CustomizerMenu.Mobile.vue'
  import { WorkflowLayout } from '@/components/customization-workflow'
  import WorkflowLayoutMobile from '@/components/customization-workflow/WorkflowLayout.Mobile.vue'
  import RightToolbar from '@/components/customizer-canvas-preview/RightToolbar.vue'
  import { CustomizerTopbar } from '@/components/customizer-topbar'
  import SmallPreview from '@/components/customizer-canvas-preview/SmallPreview.vue'
  import MobileActionBar from '@/components/customizer-canvas-preview/MobileActionBar.vue'
  import { computed } from 'vue'
  import { useUIStore } from '@/stores/ui/ui.store'

  const uiStore = useUIStore()
  // Workflow logic moved to composables
  import { useWorkflowManager, useWorkflowNavigation } from '@/composables'

  const { currentStep } = useWorkflowManager()
  const { navigationItems } = useWorkflowNavigation(() => {
    // Navigate back by going to previous step in workflow store
    // This is now handled by the workflow store itself
  })

  // const containerWidth = computed(() => uiStore.containerWidth)
  // const containerHeight = computed(() => uiStore.containerHeight)
  const isMobile = computed(() => uiStore.isMobile)
</script>

<template>
  <div
    class="px-4 py-4 md:px-6 md:py-6 w-full h-[800px] min-h-[800px] max-h-[800px] overflow-hidden flex-none"
  >
    <!-- Desktop layout -->
    <template v-if="!isMobile">
      <div
        id="main-content"
        class="flex flex-row justify-between w-full max-h-full"
      >
        <div id="nav-content" class="flex flex-row gap-4 max-h-full">
          <div id="menu-items-container" class="flex-col z-10">
            <CustomizerMenu />
          </div>
          <WorkflowLayout
            :current-step="currentStep"
            :navigation-items="navigationItems"
            :on-navigate-back="() => {}"
            class="z-20"
          />
        </div>

        <div
          id="right-content"
          class="flex flex-col w-full justify-between items-end"
        >
          <CustomizerTopbar class="z-10" />
          <div
            id="canvas-controls-container"
            class="flex flex-row w-full h-full justify-center items-center"
          >
            <ProductPreview />
            <div class="absolute w-0 ml-[50%]">
              <div
                id="canvas-controls-container-inner"
                class="flex flex-col gap-9 items-end justify-between h-full"
              >
                <RightToolbar class="z-10" />
                <SmallPreview class="z-10" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- <div
          id="bottom-content"
          class="flex flex-row justify-between items-end"
        >
          <BottomActions class="z-10" />
          <PriceCard class="z-10" />
        </div> -->
    </template>

    <!-- Mobile layout -->
    <template v-else>
      <div class="flex flex-col gap-2">
        <CustomizerTopbar class="z-10" />
        <CustomizerMenuMobile />
        <WorkflowLayoutMobile
          :current-step="currentStep"
          :on-navigate-back="() => {}"
        />
        <MobileActionBar />
      </div>
    </template>
  </div>
</template>
