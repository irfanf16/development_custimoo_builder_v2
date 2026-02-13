import { ref } from 'vue'
import { useTryCatchApi } from '@/composables/useTryCatchApi'
import { useProductsStore } from '@/stores/products/products.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useAppStore } from '@/stores/app/app.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { API } from '@/services'
import type { FactoryProduct as CartFactoryProduct } from '@/services/cart/types'
import {
  type ShareProductDetails,
  resolveShareProduct,
  extractShareProductIds,
  resolveActiveProductId,
  buildCustomizationFromShareProduct,
  remapProductIdKeys,
  updatePresetTextsWithShareFlags
} from '@/composables/useLoadShareProductIntoCustomizer'
import type { OutputDesignDetails } from '@/services/products/types'

export type LoadReorderProductParams = {
  orderItemId: number
  factoryProductId: string
}

export function useLoadReorderProductIntoCustomizer() {
  const isLoading = ref(false)
  const { tryCatchApi } = useTryCatchApi({
    defaultProperties: { composable: 'useLoadReorderProductIntoCustomizer' }
  })

  async function loadReorderProductIntoCustomizer(
    params: LoadReorderProductParams
  ): Promise<boolean> {
    const { orderItemId, factoryProductId } = params
    const productsStore = useProductsStore()
    const customizationStore = useCustomizationStore()

    isLoading.value = true
    productsStore.suspendCustomizationAutoSync()
    try {
      const resp = await tryCatchApi(API.orders.getReorderProduct(orderItemId, factoryProductId), {
        operation: 'loadReorderProductIntoCustomizer',
        order_item_id: orderItemId,
        factory_product_id: factoryProductId
      })

      const result = resp.success && resp.content ? resp.content.result : null
      if (
        !result ||
        !Array.isArray(result.factoryProducts) ||
        result.factoryProducts.length === 0
      ) {
        return false
      }

      const shareLike: ShareProductDetails = {
        factoryProducts: result.factoryProducts,
        factoryProductActiveIndex: result.factoryProductActiveIndex ?? 0,
        lockerProductId: null,
        activityId: null,
        activityItems: null,
        cartId: null,
        factoryId: null,
        id: null,
        orderId: null
      }

      const factoryProduct = resolveShareProduct(shareLike)
      if (!factoryProduct) {
        return false
      }

      const {
        productId: shareBaseProductId,
        styleId,
        designId
      } = extractShareProductIds(factoryProduct as unknown as Record<string, unknown>)

      if (!shareBaseProductId) {
        return false
      }

      let productId = shareBaseProductId
      const productResp = await productsStore.fetchActiveProductDetails(productId)

      if (!productResp?.success) {
        if (productResp?.status === 404 && shareBaseProductId) {
          const resolvedId = await resolveActiveProductId(
            shareBaseProductId,
            styleId,
            productsStore,
            customizationStore
          )

          if (!resolvedId) return false
          productId = resolvedId

          const retry = await productsStore.fetchActiveProductDetails(productId)
          if (!retry?.success) return false
        } else {
          return false
        }
      }

      await Promise.all([
        productsStore.fetchStylePreviews(productId),
        productsStore.fetchDesignPreviewsByStyleId(styleId)
      ])

      if (styleId && productsStore.activeStyleDetails?.id !== styleId) {
        const activeStyleResp = await productsStore.fetchActiveStyleDetails(styleId)
        if (!activeStyleResp?.success) return false
      }

      if (designId && productsStore.activeDesignDetails?.id !== designId) {
        const designResp = await productsStore.fetchDesignDetailsById(designId)
        if (designResp?.success && productsStore.activeDesignDetails) {
          customizationStore.setDesign(productsStore.activeDesignDetails as OutputDesignDetails)
        }
      }

      const factoryProductRecord = factoryProduct as unknown as Record<string, unknown>
      const shareCategoryId = factoryProductRecord['category_id']
      const shareSubCategoryId = factoryProductRecord['sub_category_id']

      const preservedCategoryId =
        typeof shareCategoryId === 'number'
          ? shareCategoryId
          : (customizationStore.activeCategoryId ?? 0)
      const preservedSubCategoryId =
        typeof shareSubCategoryId === 'number'
          ? shareSubCategoryId
          : shareSubCategoryId === null
            ? null
            : (customizationStore.activeSubCategoryId ?? null)

      const effectiveStyleId = productsStore.activeStyleDetails?.id ?? styleId
      const effectiveDesignId = productsStore.activeDesignDetails?.id ?? designId
      const baseCustomization = customizationStore.createDefaultCustomization({
        productId,
        styleId: effectiveStyleId,
        designId: effectiveDesignId,
        categoryId: preservedCategoryId,
        subCategoryId: preservedSubCategoryId
      })

      const designName = productsStore.activeDesignDetails?.design_name ?? ''
      const factoryProductForCustomizer = {
        ...(factoryProduct as unknown as Record<string, unknown>),
        product_id: productId
      } as unknown as CartFactoryProduct

      const nextCustomization = buildCustomizationFromShareProduct(
        factoryProductForCustomizer,
        baseCustomization,
        designName
      )

      remapProductIdKeys(nextCustomization, shareBaseProductId, productId)

      customizationStore.setCustomization(nextCustomization)

      const shareTexts = nextCustomization.product_custom_texts[String(productId)]
      const presetTexts = productsStore.activeProductDetails?.product_texts

      if (shareTexts && presetTexts && presetTexts.length > 0) {
        const updatedPresetTexts = updatePresetTextsWithShareFlags(presetTexts, shareTexts)

        if (productsStore.activeProductDetails) {
          productsStore.setActiveProductDetailsState({
            ...productsStore.activeProductDetails,
            product_texts: updatedPresetTexts
          })
        }
      }

      const appStore = useAppStore()
      appStore.setReorderFlow(true)

      const workflowStore = useWorkflowStore()
      workflowStore.setActiveStep('designs')

      return true
    } finally {
      productsStore.resumeCustomizationAutoSync()
      isLoading.value = false
    }
  }

  return { isLoading, loadReorderProductIntoCustomizer }
}
