import http from '../api'
import type {
  OutputProductCategories,
  GetProductCategoriesParams,
  GetProductCategoriesByCategoryIdParams
} from '@/services/products/types'

async function getProductCategories(params: GetProductCategoriesParams) {
  return await http.get<OutputProductCategories>('product/categories', {
    params
  })
}

async function getProductCategoriesByCategoryId(params: GetProductCategoriesByCategoryIdParams) {
  return await http.get<OutputProductCategories>(
    `list/products`, { params }
  )
}

export default {
  getProductCategories,
  getProductCategoriesByCategoryId
}
