import http from '../api'
//
import {
  mockActiveProductDetails,
  mockProductPreviews,
  mockResponse,
  mockDesignPreviewsByStyleId
} from './mocks'
import type {
  OutputProductCategories,
  GetProductCategoriesParams,
  getProductByCategoryIdParams,
  ActiveProductDetails,
  ProductPreviewItem,
  OutputProductStyleDesignBase
} from '@/services/products/types'

async function getProductCategories(params: GetProductCategoriesParams) {
  return await http.get<OutputProductCategories>('product/categories', {
    params
  })
}

async function getProductByCategoryId(params: getProductByCategoryIdParams) {
  return await http.get<OutputProductCategories>(`list/products`, { params })
}

// Mock or real endpoint to fetch full details for the active product
async function getActiveProductDetails(productId: number) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    return Promise.resolve(mockResponse(mockActiveProductDetails))
  }
  return await http.get<ActiveProductDetails>(`list/active-product-details`, {
    params: { product_id: productId }
  })
}

// Mock or real endpoint to fetch lightweight previews for all products in a category
async function getProductPreviewsByCategory(categoryId: number | null) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    return Promise.resolve(
      mockResponse<ProductPreviewItem[]>(mockProductPreviews)
    )
  }
  return await http.get<ProductPreviewItem[]>(`list/product-previews`, {
    params: { category_id: categoryId }
  })
}

async function getDesignPreviewsByStyleId(styleId: number) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    return Promise.resolve(
      mockResponse<OutputProductStyleDesignBase[]>(
        mockDesignPreviewsByStyleId(styleId)
      )
    )
  }
  return await http.get<OutputProductStyleDesignBase[]>(
    `list/design-previews`,
    {
      params: { product_style_id: styleId }
    }
  )
}

export default {
  getProductCategories,
  getProductByCategoryId,
  getActiveProductDetails,
  getProductPreviewsByCategory,
  getDesignPreviewsByStyleId
}
