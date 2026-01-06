import http from '../api'
import type {
  Collection,
  CollectionResponse,
  CopyProductPayload,
  Locker,
  LockerAssetsResponse,
  LockerDeletionResponse,
  LockerFetchResponse,
  LockerProduct,
  LockerResponse,
  LockerRoomColors,
  LockerRoomsWithColors,
  LockerUpdatePayload,
  SignedUrlResponse
} from './types'

async function getLockers() {
  return await http.get<LockerResponse<Locker[]>>('lockers')
}

async function getLockerProducts(locker_id: number) {
  return await http.get<LockerResponse<Locker[]>>(`locker-products?locker_id=${locker_id}`)
}

//endpoint: locker-products/26417?locker_product_id=26417&active_product_type=locker_product
async function getLockerProductDetails(product_id: number) {
  return await http.get<LockerResponse<LockerProduct>>(`locker-products/${product_id}`, {
    params: {
      locker_product_id: product_id,
      active_product_type: 'locker_product'
    }
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

async function fetchLockerColors() {
  return await http.get<LockerRoomColors[]>(`folder/colors`)
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
    `locker-products/presigned-upload-urls/`,
    { locker_room_id: locker_id }
  )
}

async function saveDesign(payload: FormData) {
  return await http.post<LockerResponse<any>>(`locker-products`, payload)
}

//collection requests

async function getCollections() {
  return await http.get<CollectionResponse>(`collection`)
}
async function getCollectionProducts(collection_id: number) {
  return await http.post<Collection>(`collection/collection-data`, {
    collection_id: collection_id,
    collection_prd_ids: [],
    delete_ids: []
  })
}
async function deleteCollection(id: number) {
  return await http.delete<LockerDeletionResponse>(`collection/${id}`)
}

async function saveCollection(payload: FormData) {
  return await http.post<CollectionResponse>(`collection`, payload)
}

export default {
  getLockers,
  updateLocker,
  getLockerProducts,
  getLockerProductDetails,
  createLocker,
  deleteLocker,
  fetchLockerAssets,
  fetchLockerColors,
  fetchLockersWithcolors,
  //  Product endpoints
  deleteProducts,
  copyProducts,
  saveDesign,

  // collection endpoints
  getCollections,
  getCollectionProducts,
  saveCollection,
  deleteCollection,
  //get s3 signed url
  getSignedUrl
}
