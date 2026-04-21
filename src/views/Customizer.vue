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
  import { useDebounceFn } from '@vueuse/core'
  import MobileActionBar from '@/components/customizer-canvas-preview/MobileActionBar.vue'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useRoute, useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { usePendingPostLoginAction } from '@/composables/usePendingPostLoginAction'
  import { useSignIn } from '@/composables/useSignIn'
  import { computed, onMounted, provide, ref } from 'vue'
  import { useCustomizerCanvasPairSizes } from '@/composables/useCustomizerCanvasPairSizes'
  import { CUSTOMIZER_MAIN_CANVAS_PX } from '@/lib/customizerCanvasInjectKeys'

  const uiStore = useUIStore()
  const { isMobile } = storeToRefs(uiStore)

  const canvasControlsRef = ref<HTMLElement | null>(null)
  const { mainCanvasPx, flipCanvasPx } = useCustomizerCanvasPairSizes(canvasControlsRef)

  const mainCanvasForChild = computed(() => (isMobile.value ? 600 : mainCanvasPx.value))
  const flipCanvasForChild = computed(() =>
    isMobile.value ? 156 : flipCanvasPx.value
  )

  provide(CUSTOMIZER_MAIN_CANVAS_PX, mainCanvasForChild)
  const workflowStore = useWorkflowStore()
  const productsStore = useProductsStore()
  const { activeProductDetails } = storeToRefs(productsStore)
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const { setPending } = usePendingPostLoginAction()
  const { openSignInDialog } = useSignIn()

  const handleClick = useDebounceFn(() => {
    workflowStore.toggleActiveCanvasSide()
  }, 500)

  onMounted(async () => {
    const orderId = route.params.order_id
    if (!orderId || Array.isArray(orderId)) return
    const isOrderDetailRoute =
      route.name === 'OrderDetail' || route.path.match(/^\/order\/[^/]+\/detail$/)
    if (!isOrderDetailRoute) return

    await authStore.ensureHydrated()
    if (authStore.isAuthenticated) {
      uiStore.requestOpenProfileWithOrderId(orderId)
    } else {
      setPending('openOrderDetail', orderId)
      openSignInDialog()
    }
    router.replace({ path: '/' })
  })
</script>

<template>
  <div class="w-full h-full overflow-hidden flex-none px-4 py-4 md:px-6 md:py-6">
    <!-- Mobile layout -->
    <template v-if="isMobile">
      <div id="main-content" class="mobile-layout flex flex-col gap-2 w-full h-full">
        <CustomizerTopbar class="z-widget-chrome" />
        <div class="flex flex-col">
          <ProductPreview />
          <div
            v-if="!activeProductDetails?.is_3d_product"
            class="z-widget-workflow-ornament isolate mt-[-3.5rem] w-fit cursor-pointer self-end rounded-2xl bg-white/20 p-0.5 backdrop-blur-sm"
            @click="handleClick"
          >
            <div class="bg-card border border-border rounded-[14px] overflow-hidden">
              <div class="p-2 w-[4.5rem] h-[4.5rem]">
                <TwoDScene
                  :side="workflowStore.activeCanvasSide === 'front' ? 'back' : 'front'"
                  :main-preview="true"
                  :canvas-width="600"
                  :canvas-height="600"
                  canvas-class="rounded-lg transition-opacity duration-300 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
        <MobileActionBar />
        <WorkflowLayout class="z-widget-workflow" />
        <CustomizerMenuMobile />
      </div>
    </template>
    <!-- Desktop layout -->
    <template v-else>
      <div
        id="main-content"
        class="flex max-h-full min-h-0 w-full min-w-0 flex-row justify-between overflow-hidden"
      >
        <div id="nav-content" class="flex max-h-full min-h-0 shrink-0 flex-row gap-4">
          <div id="menu-items-container" class="z-widget-workflow flex-col">
            <CustomizerMenu />
          </div>
          <WorkflowLayout />
        </div>

        <div
          id="right-content"
          class="flex min-h-0 w-full min-w-0 flex-1 flex-col self-stretch overflow-hidden"
        >
          <CustomizerTopbar class="z-widget-chrome w-full shrink-0" />
          <div
            id="canvas-controls-container"
            ref="canvasControlsRef"
            class="flex min-h-0 w-full min-w-0 flex-1 flex-row items-start justify-center gap-4 overflow-hidden px-4 py-3 sm:gap-6 sm:px-6 sm:py-4 md:px-8 md:py-5 lg:px-10 lg:py-6 xl:px-12 2xl:justify-start 2xl:px-14 2xl:py-8"
          >
            <ProductPreview />

            <div
              id="canvas-controls-container-inner"
              class="flex min-h-0 w-fit shrink-0 flex-col items-end justify-between gap-9 self-start"
            >
              <RightToolbar />

              <div
                v-if="!activeProductDetails?.is_3d_product"
                class="w-fit h-fit p-1 rounded-2xl bg-card/95 border border-border/60 cursor-pointer isolate"
                @click="handleClick"
              >
                <TwoDScene
                  :side="workflowStore.activeCanvasSide === 'front' ? 'back' : 'front'"
                  :main-preview="true"
                  :canvas-width="flipCanvasForChild"
                  :canvas-height="flipCanvasForChild"
                  lock-display-to-canvas-pixels
                  canvas-class="cursor-pointer rounded-lg object-contain transition-opacity duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
