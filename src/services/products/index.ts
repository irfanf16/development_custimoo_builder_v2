import http from '../api'
//
import {
  mockActiveProductDetails,
  mockProductPreviews,
  mockResponse,
  mockDesignPreviewsByStyleId,
  mockStylePreviewsByProduct,
  mockActiveStyleDetails,
  mockProductAddons,
  mockRecentLogos
} from './mocks'
import type {
  OutputProductCategories,
  GetProductCategoriesParams,
  getProductByCategoryIdParams,
  ActiveProductDetails,
  ProductPreviewItem,
  OutputProductStyleDesignBase,
  OutputProductStyleBase,
  OutputProductStyle,
  OutputProductStyleDesign,
  OutputAddon,
  OutputCompanyAddon
} from '@/services/products/types'
import type { OutputRecentLogo } from '@/services/products/types'

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

// Preview styles for a product
async function getStylePreviewsByProduct(productId: number) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    return Promise.resolve(
      mockResponse<OutputProductStyleBase[]>(
        mockStylePreviewsByProduct(productId)
      )
    )
  }
  return await http.get<OutputProductStyleBase[]>(`list/style-previews`, {
    params: { product_id: productId }
  })
}

// Active style details for a style id (style + default design)
async function getActiveStyleDetails(styleId: number) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    const mock = mockActiveStyleDetails(styleId)
    return Promise.resolve(
      mockResponse<{
        productstyle: OutputProductStyle
        productdesign: OutputProductStyleDesign
      }>(mock)
    )
  }
  return await http.get<{
    productstyle: OutputProductStyle
    productdesign: OutputProductStyleDesign
  }>(`list/active-style-details`, { params: { product_style_id: styleId } })
}

// Product addons bundle
async function getProductAddons(productId: number) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    const mock = mockProductAddons(productId)
    return Promise.resolve(
      mockResponse<{
        active_addons: OutputAddon[]
        product_addons: OutputAddon[]
        company_addons: OutputCompanyAddon[]
      }>(mock)
    )
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
    return Promise.resolve(
      mockResponse<OutputRecentLogo[]>(mockRecentLogos(companyId))
    )
  }
  return await http.get<OutputRecentLogo[]>(`logos/recent`, {
    params: { company_id: companyId }
  })
}

export default {
  getProductCategories,
  getProductByCategoryId,
  getActiveProductDetails,
  getProductPreviewsByCategory,
  getDesignPreviewsByStyleId,
  getStylePreviewsByProduct,
  getActiveStyleDetails,
  getProductAddons,
  getRecentLogos
}
