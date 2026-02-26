<script setup lang="ts">
  import { computed } from 'vue'
  import TwoDScene from '@/components/scene/TwoDScene.vue'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import type {
    OutputProductDetails,
    OutputStyleDetails,
    OutputDesignDetails,
    OutputProductLogosSetting
  } from '@/services/products/types'
  import type { CustomLogo } from '@/services/logos/types'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useLogosStore } from '@/stores/logos/logos.store'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { nav_logo, logos_choose_placement } from '@/paraglide/messages'

  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  const historyStore = useHistoryStore()
  const logosStore = useLogosStore()
  const profileStore = useProfileStore()

  // Emit events for parent component
  const emit = defineEmits<{
    back: []
  }>()

  const product = computed<OutputProductDetails | null>(
    () => productsStore.activeProductDetails ?? null
  )
  const styleBase = computed<OutputStyleDetails | null>(
    () => productsStore.activeStyleDetails ?? null
  )
  const designBase = computed<OutputDesignDetails | null>(
    () => productsStore.activeDesignDetails ?? null
  )
  const placements = computed<OutputProductLogosSetting[]>(() => product.value?.logos_setting || [])

  function getPlacementDesign(setting: OutputProductLogosSetting) {
    if (!designBase.value) return undefined
    const side = setting.side === 'back' ? 'back' : 'front'
    const design = side === 'back' ? designBase.value.back_design : designBase.value.front_design
    if (!design?.file_url) return undefined
    const safeZone =
      side === 'back'
        ? designBase.value.backsafezone_design?.file_url
        : designBase.value.frontsafezone_design?.file_url
    const boundary =
      side === 'back'
        ? designBase.value.backboundary_design?.file_url
        : designBase.value.frontboundary_design?.file_url
    return {
      file_url: design.file_url,
      file_extension: design.file_extension || 'svg',
      safe_zone_url: safeZone,
      boundary_url: boundary
    }
  }

  function handlePlacementSelection(_placement: OutputProductLogosSetting) {
    if (logosStore.activeLogo) {
      addActiveLogoToCustomization(logosStore.activeLogo, _placement)
    }
    // Persist placement selection if needed; for now, just return to Logos list
    workflowStore.setLogosSubStep('list')
  }

  const headerConfig = computed(() => ({
    breadcrumbs: [
      { label: nav_logo({}, { locale: profileStore.currentLocale }), action: () => emit('back') },
      { label: logos_choose_placement({}, { locale: profileStore.currentLocale }) }
    ]
  }))
  void headerConfig.value

  function addActiveLogoToCustomization(_logo: CustomLogo, _placement: OutputProductLogosSetting) {
    const merged = customizationStore.getMergedCustomizationLogo(_logo, _placement)
    const res = customizationStore.addLogoToCustomizationFromSource(merged)
    // Set default placement

    if (res) {
      historyStore.execute('logo.add', res)
    }
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-2">
      <div
        v-for="s in placements"
        :key="s.id"
        class="flex flex-col gap-4 items-center cursor-pointer w-full p-4"
        @click.once="handlePlacementSelection(s)"
      >
        <div
          class="flex-start w-full text-base font-semibold truncate leading-none overflow-visible"
        >
          {{ s.name_of_placement }}
        </div>
        <TwoDScene
          v-if="product && styleBase && designBase && getPlacementDesign(s)"
          :design="getPlacementDesign(s)"
          :side="(s.side as 'front' | 'back') || 'front'"
          :canvas-width="150"
          :canvas-height="150"
          :main-canvas-width="600"
          :main-canvas-height="600"
          :main-preview="false"
          :placement-setting="s"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
