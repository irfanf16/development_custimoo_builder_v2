import http from '../api'

import {
  type OutputProductCategories,
  type GetProductCategoriesParams,
  type ActiveProductDetails,
  type ProductPreviewItem,
  type OutputDesignPreviewFront,
  type OutputDesignPreviewBack,
  type OutputStylePreviewFront,
  type OutputDesignDetails,
  type ActiveStyleDetails,
  type GeneratePdfPayload,
  type GeneratePdfResponse
} from '@/services/products/types'
// import type { OutputRecentLogo } from '@/services/products/types'

async function getProductCategories(params: GetProductCategoriesParams) {
  return await http.get<OutputProductCategories>('product/categories', {
    params
  })
}

// Fetch full details for the active product
async function getActiveProductDetails(productId: number, hasSyncId: boolean = false) {
  const params = { has_sync_id: false }
  if (hasSyncId) {
    params.has_sync_id = true
  }
  return await http.get<ActiveProductDetails>(`product/${productId}`, { params })
}

// Fetch lightweight previews for all products in a category
async function getProductPreviewsByCategory(
  categoryId: number | null,
  subcategoryId?: number,
  syncId?: number
) {
  const params: { category_id: number | null; sub_category_id: number | null; sync_id?: number } = {
    category_id: categoryId,
    sub_category_id: subcategoryId ?? null
  }
  if (syncId) {
    params.sync_id = syncId
  }
  return await http.get<ProductPreviewItem[]>(`product/previews`, {
    params
  })
}

async function getDesignPreviewsByStyleId(styleId: number) {
  return await http.get<(OutputDesignPreviewFront & OutputDesignPreviewBack)[]>(
    `product/style/${styleId}/design/previews`
  )
}

// Preview styles for a product
async function getStylePreviewsByProduct(productId: number) {
  return await http.get<OutputStylePreviewFront[]>(`product/${productId}/style/previews`)
}

// Active style details for a style id (style + default design)
async function getActiveStyleDetails(styleId: number, activeDesignName?: string) {
  return await http.get<ActiveStyleDetails>(`product/style/${styleId}`, {
    params: {
      active_design_name: activeDesignName
    }
  })
}
// Get design details by ID
async function getDesignDetailsById(designId: number) {
  return await http.get<OutputDesignDetails>(`product/style/design/${designId}`)
}

// Download roster template for a product
async function downloadRosterTemplate(productId: number) {
  return await http.get<Blob>(`template/download/${productId}`, {
    responseType: 'blob'
  })
}

async function generatePDF(payload: GeneratePdfPayload) {
  return await http.post<GeneratePdfResponse>('generate-pdf', payload)
}

export default {
  getProductCategories,
  getActiveProductDetails,
  getProductPreviewsByCategory,
  getDesignPreviewsByStyleId,
  getStylePreviewsByProduct,
  getActiveStyleDetails,
  getDesignDetailsById,
  downloadRosterTemplate,
  generatePDF
}
