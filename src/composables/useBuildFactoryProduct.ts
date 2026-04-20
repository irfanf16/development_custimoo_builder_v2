import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useProductsStore } from '@/stores/products/products.store'
import { useSceneStore } from '@/stores/scene/scene.store'
import { useCartStore } from '@/stores/cart/cart.store'
import { useAuthStore } from '@/stores/auth/auth.store'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { base64ToFile, uploadPresignedFiles } from '@/lib/utils'
import type { ComponentPublicInstance } from 'vue'
import type { APCustomizationAddonsInfoEntry as AddonInfo } from '@/services/products/types/customization'
import type { PresignedFile } from '@/lib/utils'
import type { SignedUploadUrlItem } from '@/services/cart/types'

/**
 * Build factory_product payload from customization store
 * This is used when saving/updating products to cart
 */
export function useBuildFactoryProduct() {
  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()
  const sceneStore = useSceneStore()
  const cartStore = useCartStore()
  const authStore = useAuthStore()
  const { getItemRaw } = useLocalStorage()

  async function captureDesignImages(): Promise<{ frontImage: string; backImage: string }> {
    let frontImage = ''
    let backImage = ''

    // First try 2D scenes (front and back separately)
    const frontImageComponentRef = sceneStore.getTwoDSceneRef('front')
    if (frontImageComponentRef && 'getImageFromCanvas' in frontImageComponentRef) {
      frontImage = await (
        frontImageComponentRef as unknown as ComponentPublicInstance & {
          getImageFromCanvas: () => Promise<string>
        }
      ).getImageFromCanvas()
    }

    const backImageComponentRef = sceneStore.getTwoDSceneRef('back')
    if (backImageComponentRef && 'getImageFromCanvas' in backImageComponentRef) {
      backImage = await (
        backImageComponentRef as unknown as ComponentPublicInstance & {
          getImageFromCanvas: () => Promise<string>
        }
      ).getImageFromCanvas()
    }

    // Then try 3D scene (can get both front and back)
    const componentRef = sceneStore.threeDSceneRef
    if (componentRef && 'getImageFromCanvas' in componentRef) {
      const getImage = (
        componentRef as unknown as ComponentPublicInstance & {
          getImageFromCanvas: (side?: string) => Promise<string>
        }
      ).getImageFromCanvas
      frontImage = await getImage('front')
      backImage = await getImage('back')
    }

    return { frontImage, backImage }
  }

  async function buildFactoryProductPayload(showLoader: boolean = true): Promise<{
    factory_product: Record<string, unknown>
    product_assets?: File[]
  }> {
    const customization = customizationStore.customization
    if (!customization) {
      throw new Error('No customization data available')
    }

    const productId = customization.product_id
    const productKey = String(productId)

    // Get images from canvas
    const { frontImage, backImage } = await captureDesignImages()

    // Get company_id from localStorage
    const companyIdRaw = getItemRaw('__customizer_company_id__')
    const companyId = companyIdRaw ? Number(companyIdRaw) : null
    if (!companyId) {
      throw new Error('Company ID not found in localStorage')
    }

    // Get factory_id from active product
    const factoryId = productsStore.activeProductDetails?.factory_id ?? null

    // Upload images using signed URLs
    let frontImagePath = ''
    let backImagePath = ''

    // Prepare files for upload
    const frontFile = frontImage ? base64ToFile(frontImage, 'front.png') : null
    const backFile = backImage ? base64ToFile(backImage, 'back.png') : null

    // Collect all files to upload
    const filesToUpload: File[] = []
    if (frontFile) filesToUpload.push(frontFile)
    if (backFile) filesToUpload.push(backFile)

    // Upload all files in a single request if any files are available
    if (filesToUpload.length > 0) {
      const signedUrlResponse = await cartStore.generateSignedUploadUrl(
        {
          files: filesToUpload.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size
          })),
          companyId: companyId,
          factoryId: factoryId,
          type: 'cart',
          customer: authStore.customer?.id
        } as unknown as Parameters<typeof cartStore.generateSignedUploadUrl>[0],
        showLoader
      )

      if (
        !signedUrlResponse ||
        !signedUrlResponse.result?.urls ||
        signedUrlResponse.result.urls.length === 0
      ) {
        throw new Error('Failed to generate signed upload URLs')
      }

      const urlItems: SignedUploadUrlItem[] = signedUrlResponse.result.urls

      // Prepare presigned files for upload
      const presignedFiles: PresignedFile[] = []
      let frontUrlItem: SignedUploadUrlItem | undefined
      let backUrlItem: SignedUploadUrlItem | undefined

      // Match URL items with files based on file path (contains _front or _back) or file name
      urlItems.forEach((urlItem, index) => {
        const file = filesToUpload[index]
        if (file) {
          presignedFiles.push({
            file: file,
            presigned_url: urlItem.signed_url,
            file_type: urlItem.file_type,
            file_side: urlItem.file_side
          })

          // Determine which file this is based on file path, file_side, or filename
          const isFront =
            urlItem.file_path?.includes('_front') ||
            urlItem.file_side === 'front' ||
            file.name === 'front.png'
          const isBack =
            urlItem.file_path?.includes('_back') ||
            urlItem.file_side === 'back' ||
            file.name === 'back.png'

          if (isFront) {
            frontUrlItem = urlItem
          } else if (isBack) {
            backUrlItem = urlItem
          }
        }
      })

      // Upload all files to their signed URLs
      const uploadResults = await uploadPresignedFiles(presignedFiles)

      // Check if all uploads succeeded
      if (!uploadResults.every(result => result.success)) {
        throw new Error('Failed to upload one or more images')
      }

      // Set image paths
      if (frontUrlItem) {
        frontImagePath = frontUrlItem.file_path
      }
      if (backUrlItem) {
        backImagePath = backUrlItem.file_path
      }
    }

    // Get SVG groups from products store (merged front and back)
    const svgGroups = productsStore.svgGroups || []

    // Get custom logos
    const customLogos = customization.custom_logos[productKey] || []

    // Get product custom texts
    const productCustomTexts = customization.product_custom_texts[productKey] || []

    // Get roster detail
    const rosterDetail = customization.products_rosters[productKey] || []

    // Get product and style names from stores
    const productDisplayName = productsStore.activeProductDetails?.display_name || ''
    const productName = productsStore.activeProductDetails?.sku?.sku_id || ''
    const styleName = productsStore.activeStyleDetails?.name || ''

    // Get additional product details
    const svgParts = productsStore.activeDesignDetails?.svg_parts || []
    const measurementRatio = productsStore.activeProductDetails?.measurement_ratio || 0
    const skuNumber = productsStore.activeProductDetails?.sku?.sku_number || 0
    const sizechartReference = productsStore.activeProductDetails?.sku?.sizechart_reference || null
    const logoColors = customization.logo_colors || []

    // Build factory_product payload with all required fields
    const selectedProduct = productsStore.activeProductDetails

    // Collect full addon objects from customization (not just IDs)
    const selectedAddons = Object.values(customization.addons_info || {}).flatMap(
      (addonInfo: AddonInfo) => addonInfo?.addons || []
    )

    // Derive grouped and ungrouped addons (for backward-compatible payload fields)
    const groupedAddonsFromInfo = Object.values(customization.addons_info || {}).flatMap(
      (addonInfo: AddonInfo) => Object.values(addonInfo?.grouped_addons || {})
    )
    const grouped_addons = groupedAddonsFromInfo.flat()
    const ungrouped_addons = Object.values(customization.addons_info || {}).flatMap(
      (addonInfo: AddonInfo) => addonInfo?.ungrouped_addons || []
    )

    const factoryProduct: Record<string, unknown> = {
      // Required fields
      style_id: customization.style_id,
      design_id: customization.design_id,
      product_id: customization.product_id,
      product_type: 'customized',
      front_image: frontImagePath || '',
      back_image: backImagePath || '', // Must be present

      // Product and style names
      product_display_name: productDisplayName,
      product_name: productName,
      style_name: styleName,

      // Product details
      measurement_ratio: measurementRatio,
      sku_number: skuNumber,
      sizechart_reference: sizechartReference,

      // SVG and design data
      svg_parts: typeof svgParts === 'string' ? JSON.parse(svgParts) : svgParts,
      svg_groups: svgGroups.map(group => ({
        id: group.id,
        name: group.name || '',
        color: group.color || '',
        count: group.count || 0,
        pantone: group.pantone || null
      })),

      // Customization data
      custom_logos: customLogos, // Must be present
      product_custom_texts: productCustomTexts,
      product_roster_detail: rosterDetail, // Must be present
      custom_logo_svgs: [], // Must be present
      product_custom_text_objects: {
        common: [],
        roster: rosterDetail
      },

      // Color data
      logo_colors: logoColors,
      colors: [], // Empty array as per example
      groupcolors: customization.group_colors || {},
      defaultcolors: customization.default_colors || [],

      // Pattern and logo data
      group_patterns: customization.group_patterns || {},
      fixed_logo_index: customization.fixed_logo_index || 0,
      fixed_logos: [], // Empty array as per example
      shuffle_color_number: customization.shuffle_color_number || 0,

      // Addons (full addon objects from customization store)
      addons: selectedAddons,
      grouped_addons,
      ungrouped_addons,
      ecommerce_product_id: '',
      ecommerce_variant_id: '',
      ecommerce_modifier_id: '',
      sync_id: '',
      size_variants_mapping: null,
      category_id: customizationStore.activeCategoryId ?? undefined,
      sub_category_id: customizationStore.activeSubCategoryId ?? null,
      product_price_object: {
        product_price: 0,
        currency_code: '',
        currency_symbol: '',
        quantity: 0
      }
    }

    // Try to get ecommerce values from product details
    if (selectedProduct) {
      // Check if ecommerceproduct array exists (may not be in type definition but could be in API response)
      const productWithEcommerce = selectedProduct as typeof selectedProduct & {
        ecommerceproduct?: Array<{
          ecommerce_product_id?: string | number
          ecommerce_variant_id?: string
          ecommerce_modifier_id?: string
          sync_id?: string | number
          size_variants?: Record<string, string>
        }>
      }

      if (
        productWithEcommerce.ecommerceproduct &&
        productWithEcommerce.ecommerceproduct.length > 0
      ) {
        const ecommerce = productWithEcommerce.ecommerceproduct[0]
        if (ecommerce) {
          factoryProduct.ecommerce_product_id = ecommerce.ecommerce_product_id
            ? String(ecommerce.ecommerce_product_id)
            : ''
          factoryProduct.ecommerce_variant_id = ecommerce.ecommerce_variant_id || ''
          factoryProduct.ecommerce_modifier_id = ecommerce.ecommerce_modifier_id || ''
          factoryProduct.sync_id = ecommerce.sync_id ? String(ecommerce.sync_id) : ''
          factoryProduct.size_variants_mapping = ecommerce.size_variants
            ? ecommerce.size_variants
            : null
        }
      } else {
        // Fallback to direct properties if ecommerceproduct array doesn't exist
        factoryProduct.ecommerce_product_id = selectedProduct.ecommerce_product_id
          ? String(selectedProduct.ecommerce_product_id)
          : ''
        factoryProduct.sync_id = selectedProduct.sync_id ? String(selectedProduct.sync_id) : ''
      }
    }

    // Include id when updating (required for update)
    if (cartStore.isEditingCartProduct && cartStore.editingFactoryProductId) {
      factoryProduct.id = cartStore.editingFactoryProductId
    }
    if (customizationStore.reorderData) {
      factoryProduct.reorder_data = { ...customizationStore.reorderData }
      factoryProduct.is_reorder = true
    }

    return {
      factory_product: factoryProduct,
      product_assets: undefined // No longer needed since we upload via signed URLs
    }
  }

  return {
    buildFactoryProductPayload,
    captureDesignImages
  }
}
