import { computed, watch, ref } from 'vue'
import { useProductsStore } from '@/stores/products/products.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { storeToRefs } from 'pinia'
import type { OutputSvgGroupColor } from '@/services/products/types'

type Options = {
  autoFetch?: boolean
}

export function useEffectiveDetails(options?: Options) {
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()

  const isFetching = ref(false)

  const effectiveProductId = computed(() => {
    const fromCustomization = customizationStore.customization?.product_id
    if (fromCustomization) return Number(fromCustomization)
    return productsStore.activeProductDetails?.id ?? null
  })

  const effectiveStyleId = computed(() => {
    const fromCustomization = customizationStore.customization?.style_id
    if (fromCustomization && fromCustomization > 0) return fromCustomization
    return productsStore.activeStyleDetails?.id ?? null
  })

  const effectiveDesignId = computed(() => {
    const fromCustomization = customizationStore.customization?.design_id
    if (fromCustomization && fromCustomization > 0) return fromCustomization
    return productsStore.activeDesignDetails?.id ?? null
  })

  const effectiveSvgGroups = computed<OutputSvgGroupColor[] | undefined>(() => {
    const response = productsStore.svgGroups?.map(svgGroup => {
      // check if customization is made on this svg group
      if (customizationStore.customization?.group_colors[svgGroup.id]) {
        const customizedGroupColor =
          customizationStore.customization?.group_colors[svgGroup.id]
        return {
          id: svgGroup.id,
          name: customizedGroupColor.name ?? '',
          color: customizedGroupColor.color ?? '',
          pantone: '',
          count: 0
        }
      }
      return svgGroup
    })
    console.log('effectiveSvgGroups', response)
    return response
  })

  const {
    activeProductDetails: activeProductDetailsRef,
    activeStyleDetails: activeStyleDetailsRef,
    activeDesignDetails: activeDesignDetailsRef
  } = storeToRefs(productsStore)

  // Canvas state now lives in workflow store; keep placeholders as null defaults
  const activeCanvasSide = ref<'front' | 'back'>('front')
  const canvasZoom = ref<number>(1)

  const effectiveProductDetails = activeProductDetailsRef
  const effectiveStyleDetails = activeStyleDetailsRef
  const effectiveDesignDetails = activeDesignDetailsRef

  async function ensureActiveDetails() {
    if (isFetching.value) return
    const pid = effectiveProductId.value
    const sid = effectiveStyleId.value
    const did = effectiveDesignId.value

    try {
      isFetching.value = true
      if (
        pid &&
        (!productsStore.activeProductDetails ||
          productsStore.activeProductDetails.id !== pid)
      ) {
        const resp = await productsStore.fetchActiveProductDetails(pid)
        if (!resp.success) return
      }
      if (
        sid &&
        (!productsStore.activeStyleDetails ||
          productsStore.activeStyleDetails.id !== sid)
      ) {
        const resp = await productsStore.fetchActiveStyleDetails(sid)
        if (!resp.success) return
      }
      if (
        did &&
        (!productsStore.activeDesignDetails ||
          productsStore.activeDesignDetails.id !== did)
      ) {
        await productsStore.fetchDesignDetailsById(did)
      }
    } finally {
      isFetching.value = false
    }
  }

  if (options?.autoFetch) {
    watch(
      () => [
        customizationStore.customization?.product_id,
        customizationStore.customization?.style_id,
        customizationStore.customization?.design_id
      ],
      () => {
        ensureActiveDetails()
      },
      { immediate: true }
    )
  }

  return {
    isFetching,
    effectiveProductId,
    effectiveStyleId,
    effectiveDesignId,
    effectiveProductDetails,
    effectiveStyleDetails,
    effectiveDesignDetails,
    effectiveSvgGroups,
    activeCanvasSide,
    canvasZoom,
    ensureActiveDetails
  }
}
