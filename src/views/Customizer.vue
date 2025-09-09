<script setup lang="ts">
  import CanvasPreview from '@/components/customizer-canvas-preview/CanvasPreview.vue'
  import BottomActions from '@/components/customizer-bottom-actions/BottomActions.vue'
  import PriceCard from '@/components/customizer-price/PriceCard.vue'
  import { CustomizerMenu } from '@/components/customizer-menu'
  import { WorkflowLayout } from '@/components/customization-workflow'
  import RightToolbar from '@/components/customizer-canvas-preview/RightToolbar.vue'
  import { CustomizerTopbar } from '@/components/customizer-topbar'
  import SmallPreview from '@/components/customizer-canvas-preview/SmallPreview.vue'

  // Workflow logic moved to composables
  import { useWorkflowManager, useWorkflowNavigation } from '@/composables'
  const { currentStep, navigateBack, handleCategorySelect } =
    useWorkflowManager()
  const { navigationItems } = useWorkflowNavigation(currentStep, () =>
    navigateBack()
  )
</script>

<template>
  <div class="">
    <CanvasPreview />
    <div id="main-content overflow-hidden" class="flex flex-col w-full z-10">
      <div id="top-content" class="flex flex-row justify-between">
        <div id="left-content" class="flex flex-row gap-4">
          <div id="menu-items-container" class="flex-col">
            <CustomizerMenu />
          </div>

          <!-- Workflow management and navigation now handled via composables -->
          <WorkflowLayout
            :current-step="currentStep"
            :navigation-items="navigationItems"
            :on-navigate-back="navigateBack"
            :on-category-select="handleCategorySelect"
          />
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
