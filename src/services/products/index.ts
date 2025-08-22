import http from '../api'
import type {
  OutputProductCategories,
  GetProductCategoriesParams,
  getProductByCategoryIdParams
} from '@/services/products/types'

async function getProductCategories(params: GetProductCategoriesParams) {
  return await http.get<OutputProductCategories>('product/categories', {
    params
  })
}

async function getProductByCategoryId(params: getProductByCategoryIdParams) {
  return await http.get<OutputProductCategories>(`list/products`, { params })
}

export default {
  getProductCategories,
  getProductByCategoryId
}
