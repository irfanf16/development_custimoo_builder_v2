import http from '../api'
import type {
  OutputProductCategories,
  GetProductCategoriesParams
} from '@/services/products/types'

async function getProductCategories(params: GetProductCategoriesParams) {
  return await http.get<OutputProductCategories>('product/categories', {
    params
  })
}

export default {
  getProductCategories
}
