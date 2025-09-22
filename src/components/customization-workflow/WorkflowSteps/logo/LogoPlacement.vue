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
  import type { BreadcrumbItem } from '../../types'

  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()

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

  function handlePlacementSelection(_placement: OutputProductLogosSetting) {
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

  const headerExtras = { breadcrumbs }
  defineExpose({ headerExtras })
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="s in placements"
        :key="s.id"
        class="flex flex-col gap-2 items-center cursor-pointer"
        @click="handlePlacementSelection(s)"
      >
        <LogoPlacementThumb
          v-if="product && styleBase && designBase"
          :product="product"
          :style-base="styleBase"
          :design-base="designBase"
          :setting="s"
          :width="112"
          :height="112"
        />
        <div class="text-xs text-muted-foreground truncate max-w-[112px]">
          {{ s.name_of_placement }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
