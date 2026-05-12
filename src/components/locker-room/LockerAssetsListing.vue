<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Card } from '@/components/ui/card'
  import { Spinner } from '@/components/ui/spinner'
  import type { Locker, Logo } from '@/services/lockers/types'
  import type { CustomLogo } from '@/services/logos/types'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useLogosStore } from '@/stores/logos/logos.store'
  import { storeToRefs } from 'pinia'
  import { computed, inject, onMounted, type ComputedRef } from 'vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useCustomizerMenu } from '@/composables/useCustomizerMenu'
  import { locker_use_in_design, locker_no_assets } from '@/paraglide/messages'

  const props = defineProps<{ locker: Locker }>()

  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')
  const { isLoading, lockers } = storeToRefs(useLockerRoomStore())
  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const logosStore = useLogosStore()
  const { goTo, menuItems, pickStepOrNextAvailable } = useCustomizerMenu()
  const closeLockerBrowser = inject<(() => void) | undefined>('closeLockerBrowser')

  const logos: ComputedRef<Logo[]> = computed(() => {
    const locker = lockers.value.find(l => l.id === props.locker.id)
    return locker?.logos ?? []
  })

  function handleUseInDesign(logo: Logo) {
    const customization = customizationStore.customization
    const productDetails = productsStore.activeProductDetails
    const placements = productDetails?.logos_setting
    if (!customization || !placements?.length) return
    const productId = customization.product_id
    const styleId = customization.style_id ?? null
    const lockerLogoAsCustom: CustomLogo = {
      id: logo.id,
      product_id: productId,
      product_style_id: styleId,
      following_product_ids: null,
      rotation: undefined as unknown as number,
      originalWidth: 0,
      originalHeight: 0,
      width: 0,
      height: 0,
      name_of_placement: '',
      side: undefined as unknown as 'front',
      x_axis: 0,
      y_axis: 0,
      x_axis_3d: 0,
      y_axis_3d: 0,
      url: logo.logo_url,
      logo_name: logo.logo_name ?? '',
      is_locked: 0,
      is_vector: true,
      is_smart_transparent: false,
      haveControls: true,
      is_replace_success: false,
      logo_colors: [],
      logo_technologies: null,
      logo_index: 0,
      logo_technology: null
    } as CustomLogo
    logosStore.setActiveLogo(lockerLogoAsCustom)
    void goTo(
      pickStepOrNextAvailable(
        'logos',
        menuItems.value.map(i => i.step)
      )
    )
    workflowStore.setLogosSubStep('placement')
    closeLockerBrowser?.()
  }

  onMounted(() => {
    if (!props.locker.colours_fetched) {
      useLockerRoomStore().fetchLockerAssets(props.locker.id)
    }
  })
</script>
<template>
  <Spinner v-if="isLoading" class="size-8 text-primary m-auto mb-4" />
  <div v-else-if="!logos.length" class="py-8 text-center text-muted-foreground">
    {{ locker_no_assets({}, { locale }) }}
  </div>
  <div v-else data-testid="locker-room-assets-listing" class="grid grid-cols-1 md:grid-cols-4 gap-6 relative group">
    <Card
      v-for="(logo, logoIndex) in logos"
      :data-testid="`locker-room-asset-item-${logoIndex}`"
      :key="logoIndex"
      class="group rounded-lg cursor-pointer md:py-0 p-0 bg-transparent relative gap-0! h-fit duration-150 border-0"
    >
      <div
        class="bg-secondary rounded-md aspect-video overflow-hidden gap-1 p-[20px] border relative place-items-center"
      >
        <img
          :src="baseStorageUrl + logo.logo_url"
          class="h-full overflow-hidden object-contain rounded-md mx-auto w-full"
        />
      </div>

      <!-- Metadata -->
      <div class="flex flex-col items-center justify-center gap-2">
        <div class="mt-2 text-sm text-center font-medium w-full break-all">
          {{ logo.logo_name }}
        </div>
        <Button variant="outline" class="w-full" @click="handleUseInDesign(logo)">
          {{ locker_use_in_design({}, { locale }) }}
        </Button>
      </div>
    </Card>
  </div>
</template>
