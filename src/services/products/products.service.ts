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
  type ActiveStyleDetails
} from '@/services/products/types'
// import type { OutputRecentLogo } from '@/services/products/types'

async function getProductCategories(params: GetProductCategoriesParams) {
  return await http.get<OutputProductCategories>('product/categories', {
    params
  })
}

// Fetch full details for the active product
async function getActiveProductDetails(productId: number) {
  return await http.get<ActiveProductDetails>(`product/${productId}`)
}

// Fetch lightweight previews for all products in a category
async function getProductPreviewsByCategory(categoryId: number | null, subcategoryId?: number) {
  return await http.get<ProductPreviewItem[]>(`product/previews`, {
    params: { category_id: categoryId, sub_category_id: subcategoryId ?? null }
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

export default {
  getProductCategories,
  getActiveProductDetails,
  getProductPreviewsByCategory,
  getDesignPreviewsByStyleId,
  getStylePreviewsByProduct,
  getActiveStyleDetails,
  getDesignDetailsById
}
