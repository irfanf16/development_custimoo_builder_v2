<script setup lang="ts">
  import ProductPreview from '@/components/product-preview/ProductPreview.vue'
  import { CustomizerMenu } from '@/components/customizer-menu'
  import CustomizerMenuMobile from '@/components/customizer-menu/CustomizerMenu.Mobile.vue'
  import { WorkflowLayout } from '@/components/customization-workflow'
  import RightToolbar from '@/components/customizer-canvas-preview/RightToolbar.vue'
  import { CustomizerTopbar } from '@/components/customizer-topbar'
  import TwoDScene from '@/components/scene/TwoDScene.vue'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { storeToRefs } from 'pinia'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'

  const uiStore = useUIStore()
  const { isMobile } = storeToRefs(uiStore)
  const workflowStore = useWorkflowStore()

  function handleClick() {
    console.log('handleClick')
    workflowStore.toggleActiveCanvasSide()
  }
</script>

<template>
  <div
    class="px-4 py-4 md:px-6 md:py-6 w-full h-[500px] md:h-[800px] min-h-[500px] md:min-h-[800px] max-h-[800px] overflow-hidden flex-none"
  >
    <!-- Mobile layout -->
    <template v-if="isMobile">
      <div id="main-content" class="mobile-layout flex flex-col gap-2 w-full h-full">
        <CustomizerTopbar class="z-40" />
        <ProductPreview />
        <WorkflowLayout class="z-30" />
        <CustomizerMenuMobile />
      </div>
    </template>
    <!-- Desktop layout -->
    <template v-else>
      <div id="main-content" class="flex flex-row justify-between w-full max-h-full">
        <div id="nav-content" class="flex flex-row gap-4 max-h-full">
          <div id="menu-items-container" class="flex-col z-10">
            <CustomizerMenu />
          </div>
          <WorkflowLayout class="z-30" />
        </div>

        <div id="right-content" class="flex flex-col w-full justify-between items-end">
          <CustomizerTopbar class="z-20" />
          <div
            id="canvas-controls-container"
            class="flex flex-row w-full h-full justify-center items-center"
          >
            <ProductPreview />
            <div class="absolute w-0 ml-[50%] z-10">
              <div
                id="canvas-controls-container-inner"
                class="flex flex-col gap-9 items-end justify-between h-full"
              >
                <RightToolbar />
                <Card class="w-fit h-fit p-0 cursor-pointer" @click="handleClick">
                  <CardContent class="p-3">
                    <TwoDScene
                      :side="workflowStore.activeCanvasSide === 'front' ? 'back' : 'front'"
                      :main-preview="true"
                      :canvas-width="300"
                      :canvas-height="300"
                      canvas-class="w-[8.25rem] h-[8.25rem] rounded-lg transition-opacity duration-300 cursor-pointer"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
