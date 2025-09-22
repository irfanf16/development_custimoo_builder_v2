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

  const product = computed<OutputProductDetails | null>(
    () => productsStore.activeProductDetails ?? null
  )
  const styleBase = computed<OutputStyleDetails | null>(
    () => productsStore.activeStyleDetails ?? null
  )
  const designBase = computed<OutputDesignDetails | null>(
    () => productsStore.activeDesignDetails ?? null
  )
  const placements = computed<OutputProductLogosSetting[]>(
    () => product.value?.logos_setting || []
  )

  function toCustomLogo(
    placement: OutputProductLogosSetting,
    source: CustomLogo
  ): CustomLogo {
    const merged: CustomLogo = {
      // Identity
      id: source.id ?? placement.id,
      product_id: placement.product_id,
      product_style_id: placement.product_style_id,
      following_product_ids:
        source.following_product_ids ?? placement.following_product_ids ?? null,

      // Geometry
      rotation: (source.rotation ?? placement.rotation ?? 0) as number,
      originalWidth: (source.originalWidth ?? placement.originalWidth) as
        | number
        | string,
      originalHeight: (source.originalHeight ?? placement.originalHeight) as
        | number
        | string,
      width: (source.width ?? placement.width) as number,
      height: (source.height ?? placement.height) as number,
      name_of_placement: placement.name_of_placement,
      side: placement.side,
      x_axis: placement.x_axis,
      y_axis: placement.y_axis,
      x_axis_3d: placement.x_axis_3d,
      y_axis_3d: placement.y_axis_3d,

      // Media/meta (source takes precedence)
      url: source.url || placement.url || '',
      original_logo:
        source.original_logo ?? placement.original_logo ?? undefined,
      transparent_logo:
        source.transparent_logo ?? placement.transparent_logo ?? undefined,
      smart_transparent_logo:
        source.smart_transparent_logo ??
        placement.smart_transparent_logo ??
        undefined,
      original_logo_url:
        source.original_logo_url ?? placement.original_logo_url ?? undefined,
      logo_name: source.logo_name || placement.logo_name || '',

      // Flags/status
      is_locked: (source.is_locked ?? placement.is_locked ?? 0) as 0 | 1,
      is_vector: source.is_vector ?? placement.is_vector ?? false,
      is_smart_transparent:
        source.is_smart_transparent ?? placement.is_smart_transparent ?? null,
      haveControls: source.haveControls ?? placement.haveControls ?? true,
      logos_follows_product: (source.logos_follows_product ??
        placement.logos_follows_product) as 0 | 1 | undefined,
      is_replace_success:
        source.is_replace_success ?? placement.is_replace_success ?? false,

      // Bookkeeping
      logo_colors: source.logo_colors ?? [],
      logo_technologies:
        source.logo_technologies ?? placement.logo_technologies ?? null,
      logo_index: (source.logo_index ?? placement.logo_index ?? 0) as number,
      created_at: source.created_at ?? placement.created_at,
      updated_at: source.updated_at ?? placement.updated_at,

      // CustomLogo extras
      is_recent_logo: source.is_recent_logo,
      actualWidth: source.actualWidth,
      actualHeight: source.actualHeight,
      scaleX: source.scaleX,
      scaleY: source.scaleY
    }
    return merged
  }

  function handlePlacementSelection(_placement: OutputProductLogosSetting) {
    if (logosStore.activeLogo) {
      const merged = toCustomLogo(_placement, logosStore.activeLogo)
      addActiveLogoToCustomization(merged)
    }
    // Persist placement selection if needed; for now, just return to Logos list
    workflowStore.setLogosSubStep('list')
  }

  // Breadcrumbs: Logos -> Placement
  const breadcrumbs = computed<BreadcrumbItem[]>(() => [
    {
      label: 'Logos',
      action: () => workflowStore.setLogosSubStep('list')
    },
    { label: 'Placement' }
  ])

  function addActiveLogoToCustomization(_logo: CustomLogo) {
    const res = customizationStore.addLogoToCustomizationFromSource(_logo)
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
