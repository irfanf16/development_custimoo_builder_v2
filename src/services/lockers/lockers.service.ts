import http from '../api'
import type {
  Collection,
  CollectionByFileNameResponse,
  CollectionLogoPresignedUrlsResponse,
  CopyProductPayload,
  Locker,
  LockerAssetsResponse,
  LockerDeletionResponse,
  LockerCollectionMutationResponse,
  LockerFetchResponse,
  LockerProduct,
  LockerResponse,
  LockerRoomsWithColors,
  LockerUpdatePayload,
  SignedUrlResponse
} from './types'
import type { APCustomizationRosterEntry } from '@/services/products/types'

async function getLockers() {
  return await http.get<LockerResponse<Locker[]>>('lockers')
}

async function getLockerProducts(locker_id: number) {
  return await http.get<LockerResponse<Locker[]>>(`locker-products?locker_id=${locker_id}`)
}

//endpoint: locker-products/26417?locker_product_id=26417&active_product_type=locker_product&locker_id=123
async function getLockerProductDetails(product_id: number, locker_id?: number) {
  const params: Record<string, string | number> = {
    locker_product_id: product_id,
    active_product_type: 'locker_product'
  }
  if (locker_id) {
    params.locker_id = locker_id
  }
  return await http.get<LockerResponse<LockerProduct>>(`locker-products/${product_id}`, {
    params
  })
}

async function createLocker(name: string) {
  return await http.post<LockerResponse<LockerFetchResponse>>('lockers', { name })
}

async function updateLocker(data: LockerUpdatePayload) {
  return await http.patch<Locker>(`lockers/${data.id}`, { room_name: data.room_name })
}

async function deleteLocker(id: number) {
  return await http.delete<LockerDeletionResponse>(`lockers/${id}`)
}

async function fetchLockersWithcolors() {
  return await http.get<LockerRoomsWithColors[]>('locker_with_colors')
}

async function deleteProducts(product_ids: number[], locker_id: number) {
  return await http.delete<LockerDeletionResponse>(`locker-products/${locker_id}`, {
    data: { product_ids, force: true }
  })
}
async function copyProducts(payload: CopyProductPayload) {
  return await http.post<LockerResponse<any>>(`locker-products/copy`, payload)
}
async function fetchLockerAssets(locker_id: number) {
  return await http.get<LockerResponse<LockerAssetsResponse>>(`lockers/assets/${locker_id}`)
}
async function getSignedUrl(locker_id: number) {
  return await http.post<LockerResponse<SignedUrlResponse>>(
    `locker-products/presigned-upload-urls`,
    { locker_room_id: locker_id }
  )
}

async function saveDesign(payload: import('./types').SaveLockerProductPayload, locker_id?: number) {
  // For updating: use locker-products/{locker_id}
  // For saving: use locker-products
  const endpoint = locker_id ? `locker-products/${locker_id}` : `locker-products`
  const method = payload.id ? 'put' : 'post'
  return await http[method]<LockerResponse<any>>(endpoint, payload)
}

async function getRoster(locker_product_id: number) {
  return await http.get(`get-product-locker-roster/${locker_product_id}`)
}

async function updateRoster(locker_product_id: number, entries: APCustomizationRosterEntry[]) {
  return await http.post('update-roster', {
    locker_product_id,
    product_roster_detail: JSON.stringify(entries)
  })
}

async function downloadRosterTemplate(product_id: number) {
  return await http.get(`template/download/${product_id}`, { responseType: 'blob' })
}

//collection requests

async function getCollections() {
  return await http.get<LockerResponse<Collection[]>>(`collection`)
}

async function getCollectionByFileName(collectionFileName: string) {
  return await http.get<CollectionByFileNameResponse>(`collection/${collectionFileName}`, {
    // params: { collection_file_name: collectionFileName }
  })
}
async function getCollectionProducts(collection_id: number) {
  return await http.post<LockerResponse<Collection>>(`collection/products`, {
    collection_id: collection_id,
    collection_prd_ids: [],
    delete_ids: []
  })
}
async function deleteCollection(id: number) {
  return await http.delete<LockerDeletionResponse>(`collection/${id}`)
}

async function saveCollection(payload: FormData) {
  return await http.post<LockerCollectionMutationResponse>(`collection`, payload)
}

async function updateCollection(collection_id: number, payload: FormData) {
  return await http.post<LockerCollectionMutationResponse>(`collection/${collection_id}`, payload)
}

async function getCollectionLogoPresignedUrls(
  collection_id: number | null,
  logoFiles: Array<{ name: string; type: string; size?: number }>
) {
  return await http.post<CollectionLogoPresignedUrlsResponse>(
    `collection/generate-logo-presigned-urls`,
    {
      collection_id: collection_id || null,
      logo_files: JSON.stringify(logoFiles),
      expiration_minutes: 10
    }
  )
}

async function shareProduct(locker_product_id: number, product_id: number) {
  return await http.post<LockerResponse<{ url: string }>>(`share/product`, {
    id: locker_product_id,
    product_id: product_id
  })
}

async function shareCollection(collection_id: number) {
  return await http.get<LockerResponse<{ shared_url: string }>>(`collection/${collection_id}/share`)
}

export default {
  getLockers,
  updateLocker,
  getLockerProducts,
  getLockerProductDetails,
  createLocker,
  deleteLocker,
  fetchLockerAssets,
  fetchLockersWithcolors,
  //  Product endpoints
  deleteProducts,
  copyProducts,
  saveDesign,
  shareProduct,
  // Roster endpoints
  getRoster,
  updateRoster,
  downloadRosterTemplate,
  // collection endpoints
  getCollections,
  getCollectionByFileName,
  getCollectionProducts,
  saveCollection,
  updateCollection,
  deleteCollection,
  shareCollection,
  //get s3 signed url
  getSignedUrl,
  getCollectionLogoPresignedUrls
}
