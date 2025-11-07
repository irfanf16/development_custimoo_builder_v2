import http from '../api'
import type { AddressResponse, AddressPayload } from './types'

async function getAddresses(): Promise<AddressResponse> {
  const { data } = await http.get<AddressResponse>('/addresses')
  return data
}

async function getCountries(): Promise<{
  success: boolean
  result: Array<{ id: number; name: string }>
}> {
  const { data } = await http.get<{
    success: boolean
    result: Array<{ id: number; name: string }>
  }>('/addresses/countries')
  return data
}

async function createAddress(payload: AddressPayload): Promise<AddressResponse> {
  const { data } = await http.post<AddressResponse>('/addresses', payload)
  return data
}

async function updateAddress(
  id: number | string,
  payload: AddressPayload
): Promise<AddressResponse> {
  const { data } = await http.put<AddressResponse>(`/addresses/${id}`, payload)
  return data
}

async function deleteAddress(id: number | string): Promise<AddressResponse> {
  const { data } = await http.delete<AddressResponse>(`/addresses/${id}`)
  return data
}

async function setDefaultAddress(
  id: number | string,
  payload: Partial<AddressPayload>
): Promise<AddressResponse> {
  const { data } = await http.put<AddressResponse>(`/addresses/default/${id}`, {
    ...payload,
    default: true
  })
  return data
}

export default {
  getAddresses,
  getCountries,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
}
