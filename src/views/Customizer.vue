<script setup lang="ts">
  import ProductPreview from '@/components/product-preview/ProductPreview.vue'
  import { CustomizerMenu } from '@/components/customizer-menu'
  import CustomizerMenuMobile from '@/components/customizer-menu/CustomizerMenu.Mobile.vue'
  import { WorkflowLayout } from '@/components/customization-workflow'
  import RightToolbar from '@/components/customizer-canvas-preview/RightToolbar.vue'
  import { CustomizerTopbar } from '@/components/customizer-topbar'
  import SmallPreview from '@/components/customizer-canvas-preview/SmallPreview.vue'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { storeToRefs } from 'pinia'

  const uiStore = useUIStore()
  const { isMobile } = storeToRefs(uiStore)
</script>

<template>
  <div
    class="px-4 py-4 md:px-6 md:py-6 w-full h-[500px] md:h-[800px] min-h-[500px] md:min-h-[800px] max-h-[800px] overflow-hidden flex-none"
  >
    <!-- Mobile layout -->
    <template v-if="isMobile">
      <div id="main-content" class="mobile-layout flex flex-col gap-2 w-full h-full">
        <CustomizerTopbar class="z-20" />
        <ProductPreview />
        <WorkflowLayout class="z-10" />
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
          <WorkflowLayout class="z-10" />
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
                <SmallPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
