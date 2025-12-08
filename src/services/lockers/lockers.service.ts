import http from '../api';
import type { Locker, LockerDeletionResponse, LockerResponse, LockerUpdatePayload } from './types';

async function getLockers(): Promise<Locker[]> {
  const { data } = await http.get<LockerResponse<Locker[]>>('lockers');

  return data.data // ✅ return only the data
}

async function getLockerProducts(locker_id: number): Promise<Locker[]> {
  const response = await http.get(`locker-products?locker_id=${locker_id}`);

  return response.data as Locker[] // ✅ return only the data
}

async function createLocker(name: string): Promise<LockerResponse<Locker>> {
  const response = await http.post<LockerResponse<Locker>>('lockers', { name })
  return response.data // ✅ return only the data
}

async function updateLocker(data: LockerUpdatePayload): Promise<Locker> {
  const response = await http.patch<Locker>(`lockers/${data.id}`, { room_name: data.room_name })
  return response.data // ✅ return only the data
}

async function deleteLocker(id: number): Promise<LockerDeletionResponse> {
  const response = await http.delete<LockerDeletionResponse>(`lockers/${id}`)
  return response.data;
}

async function deleteProducts(product_ids: number[]): Promise<LockerDeletionResponse> {
  const response = await http.delete<LockerDeletionResponse>(`locker-products`, { data: { product_ids: product_ids, force: true } })
  return response.data
}

export default {
  getLockers,
  updateLocker,
  getLockerProducts,
  createLocker,
  deleteLocker,
  deleteProducts
}
