import http from '../api'
import type { AxiosResponse } from 'axios'
import {
  buildActiveProductDetails,
  buildActiveStyleDetails,
  buildActiveDesignDetails,
  buildProductPreviews,
  buildDesignPreviewsByStyleId,
  buildStylePreviewsByProduct,
  buildProductAddonsBundle,
  buildRecentLogos,
  buildProductCategories,
  buildProductsByCategoryId
} from './seed'
//
import type {
  OutputProductCategories,
  GetProductCategoriesParams,
  getProductByCategoryIdParams,
  ActiveProductDetails,
  ProductPreviewItem,
  OutputDesignPreview,
  OutputStylePreview,
  OutputStyleDetails,
  OutputDesignDetails,
  OutputAddon,
  OutputCompanyAddon
} from '@/services/products/types'
import type { OutputRecentLogo } from '@/services/products/types'

export function mockResponse<T>(data: T): AxiosResponse<T> {
  return { status: 200, data } as AxiosResponse<T>
}

async function getProductCategories(params: GetProductCategoriesParams) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    const data = await buildProductCategories(params)
    return Promise.resolve(mockResponse(data))
  }
  return await http.get<OutputProductCategories>('product/categories', {
    params
  })
}

// Convenience wrappers with explicit names requested
async function getActiveProductDetailsByProductId(productId: number) {
  return getActiveProductDetails(productId)
}

async function getActiveStyleDetailsByStyleId(styleId: number) {
  return getActiveStyleDetails(styleId)
}

async function getActiveDesignDetailsByDesignId(designId: number) {
  return getDesignDetailsById(designId)
}

async function getProductByCategoryId(params: getProductByCategoryIdParams) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    const data = await buildProductsByCategoryId(params)
    return Promise.resolve(mockResponse(data))
  }
  return await http.get<OutputProductCategories>(`list/products`, { params })
}

// Mock or real endpoint to fetch full details for the active product
async function getActiveProductDetails(productId: number) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    const built = await buildActiveProductDetails(productId)
    return Promise.resolve(mockResponse(built as ActiveProductDetails))
  }
  return await http.get<ActiveProductDetails>(`list/active-product-details`, {
    params: { product_id: productId }
  })
}

// Mock or real endpoint to fetch lightweight previews for all products in a category
async function getProductPreviewsByCategory(categoryId: number | null) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    const items = await buildProductPreviews({ categoryId })
    return Promise.resolve(mockResponse<ProductPreviewItem[]>(items))
  }
  return await http.get<ProductPreviewItem[]>(`list/product-previews`, {
    params: { category_id: categoryId }
  })
}

async function getDesignPreviewsByStyleId(styleId: number) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    const items = await buildDesignPreviewsByStyleId(styleId)
    return Promise.resolve(mockResponse<OutputDesignPreview[]>(items))
  }
  return await http.get<OutputDesignPreview[]>(`list/design-previews`, {
    params: { product_style_id: styleId }
  })
}

// Preview styles for a product
async function getStylePreviewsByProduct(productId: number) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    const items = await buildStylePreviewsByProduct(productId)
    return Promise.resolve(mockResponse<OutputStylePreview[]>(items))
  }
  return await http.get<OutputStylePreview[]>(`list/style-previews`, {
    params: { product_id: productId }
  })
}

// Active style details for a style id (style + default design)
async function getActiveStyleDetails(styleId: number) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    const built = await buildActiveStyleDetails(styleId)
    const payload = {
      productstyle: built!.styleDetails,
      productdesign: built!.designDetails
    }
    return Promise.resolve(
      mockResponse<{
        productstyle: OutputStyleDetails
        productdesign: OutputDesignDetails
      }>(payload)
    )
  }
  return await http.get<{
    productstyle: OutputStyleDetails
    productdesign: OutputDesignDetails
  }>(`list/active-style-details`, { params: { product_style_id: styleId } })
}

// Product addons bundle
async function getProductAddons(productId: number) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    const bundle = await buildProductAddonsBundle(productId)
    return Promise.resolve(mockResponse(bundle))
  }
  return await http.get<{
    active_addons: OutputAddon[]
    product_addons: OutputAddon[]
    company_addons: OutputCompanyAddon[]
  }>(`list/product-addons`, { params: { product_id: productId } })
}

// Recently uploaded logos
async function getRecentLogos(companyId?: number) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    const items = await buildRecentLogos(companyId)
    return Promise.resolve(mockResponse<OutputRecentLogo[]>(items))
  }
  return await http.get<OutputRecentLogo[]>(`logos/recent`, {
    params: { company_id: companyId }
  })
}

// Get design details by ID
async function getDesignDetailsById(designId: number) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    const built = await buildActiveDesignDetails(designId)
    return Promise.resolve(mockResponse(built!.designDetails))
  }
  return await http.get<OutputDesignDetails>(`list/design-details`, {
    params: { design_id: designId }
  })
}

// New combined previews endpoint supporting categoryId, styleId, designId
async function getProductPreviews(params: {
  categoryId?: number | null
  styleId?: number | null
  designId?: number | null
}): Promise<AxiosResponse<ProductPreviewItem[]>> {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    const items = await buildProductPreviews(params)
    return Promise.resolve(mockResponse(items))
  }
  // Defer to existing endpoints on real backend depending on param priority
  if (params.designId) {
    // On real backend you might have a different route; fall back to category previews
    return http.get<ProductPreviewItem[]>(`list/product-previews`, {
      params: { design_id: params.designId }
    })
  }
  if (params.styleId) {
    return http.get<ProductPreviewItem[]>(`list/product-previews`, {
      params: { product_style_id: params.styleId }
    })
  }
  return http.get<ProductPreviewItem[]>(`list/product-previews`, {
    params: { category_id: params.categoryId ?? null }
  })
}

export default {
  getProductCategories,
  getProductByCategoryId,
  getActiveProductDetails,
  getActiveProductDetailsByProductId,
  getProductPreviewsByCategory,
  getProductPreviews,
  getDesignPreviewsByStyleId,
  getStylePreviewsByProduct,
  getActiveStyleDetails,
  getActiveStyleDetailsByStyleId,
  getProductAddons,
  getRecentLogos,
  getDesignDetailsById,
  getActiveDesignDetailsByDesignId
}
