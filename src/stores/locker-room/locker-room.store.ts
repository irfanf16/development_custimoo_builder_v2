import { API } from '@/services'
import type { Locker } from '@/services/lockers/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { tryCatchApi } from '../utils'

export const useLockerRoomStore = defineStore('lockerRoomStore', () => {
  const lockers = ref<Locker[]>([])
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  async function fetchLockers() {
    isLoading.value = true
    error.value = null
    const response = await tryCatchApi(API.lockers.getLockers())
    if (response.success && response.content) {
      lockers.value = response.content.data
    } else {
      setError('Failed to load lockers')
    }
    isLoading.value = false
  }
  async function fetchLockerProducts(locker_id: number): Promise<Locker | undefined> {
    isLoading.value = true
    error.value = null
    const resp = await tryCatchApi(API.lockers.getLockerProducts(locker_id))
    if (resp.success && resp.content) {
      const data = resp.content
      lockers.value = lockers.value.map(l =>
        l.id === locker_id ? { ...l, ...data[0], details_fetched: true } : l
      )
      isLoading.value = false
      return data[0]
    } else {
      setError('Failed to load locker products')
    }
    isLoading.value = false
  }

  async function createLocker(name: string) {
    isLoading.value = true
    error.value = null
    const resp = await tryCatchApi(API.lockers.createLocker(name))
    if (resp.success && resp.content) {
      const data = resp.content.data
      lockers.value.push({
        collection: data.collection,
        id: data.id,
        product_count: 0,
        products: data.products,
        room_name: data.room_name
      } as Locker)
    } else {
      setError('Failed to create locker')
    }
    isLoading.value = false
  }

  async function updateLockers(locker: Locker) {
    const resp = await tryCatchApi(
      API.lockers.updateLocker({ id: locker.id, room_name: locker.room_name })
    )
    if (!resp.success) {
      setError('Failed to update locker')
      return
    }
    lockers.value = lockers.value.map(l => {
      if (l.id === locker.id) {
        return {
          ...locker,
          products: locker.product.map(prod => prod.product_front_url).slice(0, 4)
        }
      } else {
        return l
      }
    })
  }

  async function deleteLocker(id: number) {
    const resp = await tryCatchApi(API.lockers.deleteLocker(id))
    if (!resp.success) {
      setError('Failed to delete locker')
      return
    }
    lockers.value = lockers.value.filter(locker => locker.id !== id)
  }

  //Delete Locker Products
  async function deleteProducts(product_ids: number[], locker_id: number) {
    const resp = await tryCatchApi(API.lockers.deleteProducts(product_ids, locker_id))
    if (!resp.success) {
      setError('Failed to delete products')
      return
    }
    await fetchLockerProducts(locker_id)
  }

  //error message
  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }
  return {
    lockers,
    isLoading,
    error,
    //functions
    fetchLockers,
    fetchLockerProducts,
    createLocker,
    updateLockers,
    deleteLocker,
    //Products Endpoint
    deleteProducts
  }
})
