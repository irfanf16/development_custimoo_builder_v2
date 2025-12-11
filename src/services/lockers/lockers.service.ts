import http from '../api'
import type {
  CopyProductPayload,
  Locker,
  LockerAssetsResponse,
  LockerDeletionResponse,
  LockerFetchResponse,
  LockerResponse,
  LockerUpdatePayload
} from './types'

async function getLockers() {
  return await http.get<LockerResponse<Locker[]>>('lockers')
}

async function getLockerProducts(locker_id: number) {
  return await http.get<LockerResponse<Locker[]>>(`locker-products?locker_id=${locker_id}`)
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

export default {
  getLockers,
  updateLocker,
  getLockerProducts,
  createLocker,
  deleteLocker,
  deleteProducts,
  copyProducts,
  fetchLockerAssets
}
