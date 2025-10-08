<script setup lang="ts">
  import { computed } from 'vue'
  import LogoPlacementThumb from './LogoPlacementThumb.vue'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import type {
    OutputProductDetails,
    OutputStyleDetails,
    OutputDesignDetails,
    OutputProductLogosSetting
  } from '@/services/products/types'
  import type { CustomLogo } from '@/services/logos/types'
  import type { BreadcrumbItem } from '../../types'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useLogosStore } from '@/stores/logos/logos.store'

  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  const historyStore = useHistoryStore()
  const logosStore = useLogosStore()

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

  function handlePlacementSelection(_placement: OutputProductLogosSetting) {
    if (logosStore.activeLogo) {
      addActiveLogoToCustomization(logosStore.activeLogo, _placement)
    }
    // Persist placement selection if needed; for now, just return to Logos list
    workflowStore.setLogosSubStep('list')
  }

  // Breadcrumbs: Logos -> Placement
  const breadcrumbs = computed<BreadcrumbItem[]>(() => [
    {
      label: 'Logos',
      action: () => emit('back')
    },
    { label: 'Placement' }
  ])

  function addActiveLogoToCustomization(_logo: CustomLogo, _placement: OutputProductLogosSetting) {
    const res = customizationStore.addLogoToCustomizationFromSource(
      customizationStore.getMergedCustomizationLogo(_logo, _placement)
    )
    // Set default placement
    if (res) historyStore.execute('logo.add', res)
  }

  const headerExtras = { breadcrumbs }
  defineExpose({ headerExtras })
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-2">
      <div
        v-for="s in placements"
        :key="s.id"
        class="flex flex-col gap-4 items-center cursor-pointer w-full p-4"
        @click="handlePlacementSelection(s)"
      >
        <div
          class="flex-start w-full text-base font-semibold truncate leading-none overflow-visible"
        >
          {{ s.name_of_placement }}
        </div>
        <LogoPlacementThumb
          v-if="product && styleBase && designBase"
          :product="product"
          :style-base="styleBase"
          :design-base="designBase"
          :setting="s"
          :width="112"
          :height="112"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
