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
  import { useDebounceFn, useElementSize } from '@vueuse/core'
  import MobileActionBar from '@/components/customizer-canvas-preview/MobileActionBar.vue'
  import MobileBodyDockShell from '@/components/MobileBodyDockShell.vue'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useRoute, useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { usePendingPostLoginAction } from '@/composables/usePendingPostLoginAction'
  import { useSignIn } from '@/composables/useSignIn'
  import { computed, onMounted, provide, ref } from 'vue'
  import {
    useCustomizerCanvasPairSizes,
    CUSTOMIZER_FLIP_CANVAS_BITMAP_PX,
    CUSTOMIZER_MAIN_CANVAS_MAX_PX
  } from '@/composables/useCustomizerCanvasPairSizes'
  import { CUSTOMIZER_MAIN_CANVAS_PX } from '@/lib/customizerCanvasInjectKeys'
  import { useTeleportTo } from '@/composables/useTeleportTo'

  const { teleportTo } = useTeleportTo()
  const uiStore = useUIStore()
  const { isMobile, isTrueMobile, containerWidth, containerHeight } = storeToRefs(uiStore)

  /** Customizer `px-4` + a little margin so the 2D scene fits; avoid fixed 600px (overflows on phones). */
  const TRUE_MOBILE_MAIN_H_PAD = 40
  /**
   * Fallback when the preview host has not been measured yet (first frame / SSR). Flip is
   * absolutely positioned; do not over-subtract vertical space so the main preview can grow.
   */
  const TRUE_MOBILE_MAIN_V_CHROME_FALLBACK = 220

  const canvasControlsRef = ref<HTMLElement | null>(null)
  const trueMobilePanelRef = ref<HTMLElement | null>(null)
  const { width: trueMobilePanelW, height: trueMobilePanelH } = useElementSize(trueMobilePanelRef)
  const { mainCanvasPx, flipCanvasPx } = useCustomizerCanvasPairSizes(canvasControlsRef)

  const mainCanvasForChild = computed(() => {
    if (!isTrueMobile.value) return mainCanvasPx.value
    const ew = trueMobilePanelW.value
    const eh = trueMobilePanelH.value
    /** Tight padding inside the true-mobile preview host; the flip overlays the corner and does not need a layout cut-out. */
    if (ew > 0 && eh > 0) {
      const inset = 4
      const wSide = Math.max(0, Math.floor(ew - inset * 2))
      const hSide = Math.max(0, Math.floor(eh - inset * 2))
      const side = Math.min(CUSTOMIZER_MAIN_CANVAS_MAX_PX, wSide, hSide)
      return Math.max(1, side)
    }
    const w =
      containerWidth.value > 0
        ? containerWidth.value
        : typeof window !== 'undefined'
          ? window.innerWidth
          : 400
    const hFromStore =
      containerHeight.value > 0
        ? containerHeight.value
        : typeof window !== 'undefined'
          ? window.innerHeight
          : 800
    const h =
      typeof window !== 'undefined' ? Math.min(hFromStore, window.innerHeight) : hFromStore
    const wSide = Math.max(0, Math.floor(w - TRUE_MOBILE_MAIN_H_PAD))
    const hSide = Math.max(0, Math.floor(h - TRUE_MOBILE_MAIN_V_CHROME_FALLBACK))
    const side = Math.max(
      1,
      Math.min(CUSTOMIZER_MAIN_CANVAS_MAX_PX, wSide, hSide)
    )
    return side
  })
  /**
   * True-mobile flip *chip* stays small; TwoDScene uses this for CSS + lock display, with
   * `canvas-bitmap-*` 156 so Fabric keeps detail and scales to fit the chip.
   */
  const TRUE_MOBILE_FLIP_CHIP_DISPLAY_PX = 64

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
  <div
    data-testid="customizer-root"
    class="flex w-full h-full min-h-0 flex-none overflow-x-hidden px-4 py-4 md:px-6 md:py-6"
    :class="isTrueMobile ? 'max-h-full !overflow-y-hidden' : 'md:overflow-y-auto'"
  >
    <!-- Mobile + tablet-hybrid layout (widget width < 1025) -->
    <template v-if="isMobile">
      <div
        id="main-content"
        class="mobile-layout flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden"
      >
        <CustomizerTopbar class="z-widget-chrome" />

        <!-- True mobile (≤768px): main fills host; flip absolute to host (scrolls with customizer, not the viewport) -->
        <template v-if="isTrueMobile">
          <div
            ref="trueMobilePanelRef"
            class="relative min-h-0 w-full min-w-0 flex-1 overflow-hidden"
          >
            <div class="relative h-full min-h-0 w-full min-w-0">
              <ProductPreview />
            </div>
            <div
              v-if="!activeProductDetails?.is_3d_product"
              class="absolute bottom-2 right-2 z-[30] w-fit max-w-[calc(100%-0.5rem)] cursor-pointer rounded-2xl border border-border/30 bg-white/20 p-0.5 shadow-sm backdrop-blur-sm sm:bottom-2.5 sm:right-2.5"
              @click="handleClick"
            >
              <div class="overflow-hidden rounded-[14px] border border-border bg-card shadow-sm">
                <div class="p-1.5 sm:p-2">
                  <div
                    class="shrink-0"
                    :style="{
                      width: `${TRUE_MOBILE_FLIP_CHIP_DISPLAY_PX}px`,
                      height: `${TRUE_MOBILE_FLIP_CHIP_DISPLAY_PX}px`
                    }"
                  >
                    <TwoDScene
                      :side="workflowStore.activeCanvasSide === 'front' ? 'back' : 'front'"
                      :main-preview="true"
                      :canvas-width="TRUE_MOBILE_FLIP_CHIP_DISPLAY_PX"
                      :canvas-height="TRUE_MOBILE_FLIP_CHIP_DISPLAY_PX"
                      :canvas-bitmap-width="CUSTOMIZER_FLIP_CANVAS_BITMAP_PX"
                      :canvas-bitmap-height="CUSTOMIZER_FLIP_CANVAS_BITMAP_PX"
                      lock-display-to-canvas-pixels
                      canvas-class="rounded-lg object-contain transition-opacity duration-300 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <MobileActionBar />
        </template>

        <!-- Tablet hybrid (769–1024px): desktop-style canvas row, flip chip left of RightToolbar -->
        <template v-else>
          <div
            id="canvas-controls-container"
            ref="canvasControlsRef"
            class="flex min-h-0 w-full min-w-0 flex-1 flex-row items-start justify-center gap-4 overflow-hidden px-4 py-3 sm:gap-6 sm:px-6 sm:py-4 md:px-6 md:py-5"
          >
            <ProductPreview />

            <div class="flex min-h-0 flex-row items-end gap-2 self-start">
              <div
                v-if="!activeProductDetails?.is_3d_product"
                class="w-fit h-fit p-1 rounded-2xl bg-card/95 border border-border/60 cursor-pointer isolate"
                @click="handleClick"
              >
                <TwoDScene
                  :side="workflowStore.activeCanvasSide === 'front' ? 'back' : 'front'"
                  :main-preview="true"
                  :canvas-width="flipCanvasPx"
                  :canvas-height="flipCanvasPx"
                  :canvas-bitmap-width="CUSTOMIZER_FLIP_CANVAS_BITMAP_PX"
                  :canvas-bitmap-height="CUSTOMIZER_FLIP_CANVAS_BITMAP_PX"
                  lock-display-to-canvas-pixels
                  canvas-class="cursor-pointer rounded-lg object-contain transition-opacity duration-300"
                />
              </div>
              <RightToolbar />
            </div>
          </div>
        </template>

        <Teleport :to="teleportTo">
          <MobileBodyDockShell>
            <WorkflowLayout class="z-widget-workflow" />
            <CustomizerMenuMobile />
          </MobileBodyDockShell>
        </Teleport>
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
              class="flex min-h-0 w-full min-w-0 shrink-0 flex-col items-center justify-between gap-9 self-start sm:w-fit sm:min-w-0 max-lg:max-w-full lg:items-end"
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
                  :canvas-width="flipCanvasPx"
                  :canvas-height="flipCanvasPx"
                  :canvas-bitmap-width="CUSTOMIZER_FLIP_CANVAS_BITMAP_PX"
                  :canvas-bitmap-height="CUSTOMIZER_FLIP_CANVAS_BITMAP_PX"
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
