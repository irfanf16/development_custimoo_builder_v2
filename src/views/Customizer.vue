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
  import MobileActionBar from '@/components/customizer-canvas-preview/MobileActionBar.vue'

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
        <div class="flex flex-col">
          <ProductPreview />
          <div
            class="w-fit h-fit mt-[-3.5rem] p-0.5 rounded-2xl backdrop-blur-sm bg-white/20 cursor-pointer self-end z-10"
            @click="handleClick"
          >
            <div class="bg-card border border-border rounded-[14px] overflow-hidden">
              <div class="p-2 w-[4.5rem] h-[4.5rem]">
                <TwoDScene
                  :side="workflowStore.activeCanvasSide === 'front' ? 'back' : 'front'"
                  :main-preview="true"
                  :canvas-width="300"
                  :canvas-height="300"
                  canvas-class="rounded-lg transition-opacity duration-300 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
        <MobileActionBar />
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
            class="flex flex-row w-full h-full justify-center 2xl:justify-start items-center p-[64px]"
          >
            <ProductPreview />
            <div class="w-0 z-10 self-start ml-[-50px]">
              <div class="absolute">
                <div
                  id="canvas-controls-container-inner"
                  class="flex flex-col gap-9 items-end justify-between h-full"
                >
                  <RightToolbar />
                  <Card class="w-fit h-fit p-0 cursor-pointer" @click="handleClick">
                    <CardContent class="w-[180px] h-auto">
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
      </div>
    </template>
  </div>
</template>
