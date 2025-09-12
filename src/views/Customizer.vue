<script setup lang="ts">
  import CanvasPreview from '@/components/customizer-canvas-preview/CanvasPreview.vue'
  import BottomActions from '@/components/customizer-bottom-actions/BottomActions.vue'
  import PriceCard from '@/components/customizer-price/PriceCard.vue'
  import { CustomizerMenu } from '@/components/customizer-menu'
  import { WorkflowLayout } from '@/components/customization-workflow'
  import RightToolbar from '@/components/customizer-canvas-preview/RightToolbar.vue'
  import { CustomizerTopbar } from '@/components/customizer-topbar'
  import SmallPreview from '@/components/customizer-canvas-preview/SmallPreview.vue'
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

  const containerWidth = computed(() => uiStore.containertWidth)
  const containerHeight = computed(() => uiStore.containerHeight)
</script>

<template>
  <div class="">
    <CanvasPreview class="" />
    <div class="absolute w-0 h-0">
      <div
        class="px-6 py-6"
        :style="{
          width: `${containerWidth}px`,
          height: `${containerHeight}px`
        }"
      >
        <div id="main-content overflow-hidden" class="flex flex-col w-full z-0">
          <div id="top-content" class="flex flex-row justify-between">
            <div id="left-content" class="flex flex-row gap-4">
              <div id="menu-items-container" class="flex-col z-10">
                <CustomizerMenu />
              </div>

              <!-- Workflow management and navigation now handled via composables -->
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
                class="flex flex-col grow items-center w-full h-full"
              >
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
          <div
            id="bottom-content"
            class="flex flex-row justify-between items-end"
          >
            <BottomActions class="z-10" />
            <PriceCard class="z-10" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
