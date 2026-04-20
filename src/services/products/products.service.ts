import http from '../api'
import axios from 'axios'
import type {
  CustomDesignPresignedUploadRequest,
  RegisterCustomDesignRequest
} from '@/services/customers/types'

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
import type { LockerResponse } from '../lockers/types'
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
  const params: Record<string, string> = {}
  if (activeDesignName != null && String(activeDesignName).trim() !== '') {
    params.active_design_name = String(activeDesignName).trim()
  }
  return await http.get<ActiveStyleDetails>(`product/style/${styleId}`, { params })
}
// Get design details by ID
async function getDesignDetailsById(designId: number) {
  return await http.get<OutputDesignDetails>(`product/style/design/${designId}`)
}

/**
 * Presigned S3 upload URL for custom design SVG.
 * Uses shared `http` client (CustomerToken, interceptors, base URL) — same as `customer/upload/logo`.
 */
async function getCustomDesignPresignedUploadUrl(payload: CustomDesignPresignedUploadRequest) {
  return await http.post<unknown>('customer/custom-design/presigned-upload-url', payload)
}

/**
 * Register custom design after the file is on S3. Uses shared `http` client.
 */
async function registerCustomDesign(payload: RegisterCustomDesignRequest) {
  return await http.post<unknown>('customer/custom-design', payload)
}

/**
 * PUT file bytes to an S3 presigned URL. Must use bare `axios` — do **not** use `http` or the
 * CustomerToken / API base URL would be sent to AWS and break the signature.
 */
async function putCustomDesignFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  contentType: string
) {
  // Prefer the File's own type when it's a real SVG MIME (browser is usually right for re-uploads)
  const ct =
    file.type && /svg|xml/i.test(file.type) ? file.type : contentType?.trim() || 'image/svg+xml'
  return axios.put(uploadUrl, file, {
    headers: { 'Content-Type': ct }
  })
}

/** Delete a customer-uploaded custom design by design id. */
async function deleteCustomDesign(designId: number) {
  return await http.delete(`product/style/design/custom/${designId}`)
}

/**
 * Normalize presigned-upload API body (flat or wrapped in `data` / `result`).
 * Backend example: presigned_url, path, content_type, name, file_name, extension.
 */
export function normalizePresignedCustomDesignResponse(data: unknown): {
  uploadUrl: string
  /** Storage-relative path for register payload `file_url` (e.g. company_1/files/custom_design/88/….svg) */
  fileUrl: string
  /** Prefer for S3 PUT Content-Type when API returns it */
  contentType?: string
  /** Optional display name from API (`name` field) */
  designName?: string
} | null {
  if (data == null || typeof data !== 'object') return null
  const root = data as Record<string, unknown>
  const layers: Record<string, unknown>[] = [root]
  if (root.data != null && typeof root.data === 'object') {
    layers.push(root.data as Record<string, unknown>)
  }
  if (root.result != null && typeof root.result === 'object') {
    layers.push(root.result as Record<string, unknown>)
  }

  function findString(keys: string[]): string | undefined {
    for (const key of keys) {
      for (const layer of layers) {
        const v = layer[key]
        if (typeof v === 'string' && v.length > 0) return v
      }
    }
    return undefined
  }

  const uploadUrl = findString(['presigned_url', 'upload_url', 'url'])
  const fileUrl = findString(['path', 'file_url', 'key'])
  const contentType = findString(['content_type'])
  const designName = findString(['name'])

  if (!uploadUrl) return null
  return { uploadUrl, fileUrl: fileUrl ?? '', contentType, designName }
}

/**
 * Reads design id from register-custom-design JSON.
 * Supports `{ result: { product_design_id } }` (customer/custom-design) and legacy `id` / `design_id`.
 */
/**
 * Unwrap design previews from GET `product/style/:id/design/previews` (raw array or `{ result }` / `{ data }`).
 */
export function normalizeDesignPreviewsPayload(
  data: unknown
): (OutputDesignPreviewFront & OutputDesignPreviewBack)[] | null {
  if (data == null) return null
  if (Array.isArray(data)) return data as (OutputDesignPreviewFront & OutputDesignPreviewBack)[]
  if (typeof data === 'object') {
    const o = data as Record<string, unknown>
    const inner = o.result ?? o.data
    if (Array.isArray(inner)) return inner as (OutputDesignPreviewFront & OutputDesignPreviewBack)[]
  }
  return null
}

export function parseCustomDesignUploadResponseId(data: unknown): number | null {
  if (data == null || typeof data !== 'object') return null
  const root = data as Record<string, unknown>

  function readId(obj: Record<string, unknown>): number | null {
    const n = (v: unknown): number | null => {
      if (typeof v === 'number' && Number.isFinite(v)) return v
      if (typeof v === 'string' && v.trim() !== '') {
        const p = Number(v)
        return Number.isFinite(p) ? p : null
      }
      return null
    }
    return n(obj.product_design_id) ?? n(obj.design_id) ?? n(obj.id)
  }

  const direct = readId(root)
  if (direct != null) return direct

  if (root.result != null && typeof root.result === 'object') {
    const fromResult = readId(root.result as Record<string, unknown>)
    if (fromResult != null) return fromResult
  }

  if (root.data != null && typeof root.data === 'object') {
    const fromData = readId(root.data as Record<string, unknown>)
    if (fromData != null) return fromData
  }

  return null
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

async function shareDesignUrl(payload: import('./types/base-product').ShareDesignPayload) {
  return await http.post<{ url: string }>('product/share-design-url', payload)
}

async function getProductsByShareUrl(shared_url: string) {
  return await http.get<
    LockerResponse<{
      factoryProducts: import('@/services/cart/types').FactoryProduct[]
      factoryProductActiveIndex: number
      lockerProductId: number | null
      activityId: number | null
      activityItems: unknown
      cartId: number | null
      factoryId: number | null
      id: number | null
      orderId: number | null
    }>
  >('product/shared', {
    params: { shared_url }
  })
}

export default {
  getProductCategories,
  getActiveProductDetails,
  getProductPreviewsByCategory,
  getDesignPreviewsByStyleId,
  getStylePreviewsByProduct,
  getActiveStyleDetails,
  getDesignDetailsById,
  getCustomDesignPresignedUploadUrl,
  registerCustomDesign,
  putCustomDesignFileToPresignedUrl,
  deleteCustomDesign,
  downloadRosterTemplate,
  generatePDF,
  shareDesignUrl,
  getProductsByShareUrl
}
