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
  import { onMounted } from 'vue'

  const uiStore = useUIStore()
  const { isMobile } = storeToRefs(uiStore)
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
        <CustomizerTopbar class="z-40" />
        <div class="flex flex-col">
          <ProductPreview />
          <div
            v-if="!activeProductDetails?.is_3d_product"
            class="w-fit h-fit mt-[-3.5rem] p-0.5 rounded-2xl backdrop-blur-sm bg-white/20 cursor-pointer self-end z-10"
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
                  <div
                    v-if="!activeProductDetails?.is_3d_product"
                    class="w-fit h-fit p-1 rounded-2xl backdrop-blur-sm bg-white/20 cursor-pointer"
                    @click="handleClick"
                  >
                    <div class="bg-card border border-border rounded-[14px] p-3 relative">
                      <div class="w-[9.75rem] h-[9.75rem] flex items-center justify-center">
                        <TwoDScene
                          :side="workflowStore.activeCanvasSide === 'front' ? 'back' : 'front'"
                          :main-preview="true"
                          :canvas-width="600"
                          :canvas-height="600"
                          canvas-class="w-full h-full object-contain rounded-lg transition-opacity duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
