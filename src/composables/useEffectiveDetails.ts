import { computed, watch, ref, type Ref } from 'vue'
import { useProductsStore } from '@/stores/products/products.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { storeToRefs } from 'pinia'
import type {
  OutputProductDetails,
  OutputStyleDetails,
  OutputDesignDetails
} from '@/services/products/types'

type Options = {
  autoFetch?: boolean
}

type UseEffectiveDetailsReturn = {
  isFetching: Ref<boolean>
  effectiveProductId: Ref<number | null>
  effectiveStyleId: Ref<number | null>
  effectiveDesignId: Ref<number | null>
  effectiveProductDetails: Ref<OutputProductDetails | null>
  effectiveStyleDetails: Ref<OutputStyleDetails | null>
  effectiveDesignDetails: Ref<OutputDesignDetails | null>
  activeCanvasSide: Ref<'front' | 'back'>
  canvasZoom: Ref<number>
  ensureActiveDetails: () => Promise<void> | void
}

export function useEffectiveDetails(
  options?: Options
): UseEffectiveDetailsReturn {
  const productsStore = useProductsStore()
  const selectionStore = useCustomizationStore()

  const isFetching = ref(false)

  const effectiveProductId = computed(() => {
    const fromCustomization = selectionStore.customization?.product_id
    if (fromCustomization) return Number(fromCustomization)
    return productsStore.activeProductDetails?.id ?? null
  })

  const effectiveStyleId = computed(() => {
    const fromCustomization = selectionStore.customization?.style_id
    if (fromCustomization && fromCustomization > 0) return fromCustomization
    return productsStore.activeStyleDetails?.id ?? null
  })

  const effectiveDesignId = computed(() => {
    const fromCustomization = selectionStore.customization?.design_id
    if (fromCustomization && fromCustomization > 0) return fromCustomization
    return productsStore.activeDesignDetails?.id ?? null
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
        selectionStore.customization?.product_id,
        selectionStore.customization?.style_id,
        selectionStore.customization?.design_id
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
    activeCanvasSide,
    canvasZoom,
    ensureActiveDetails
  }
}
