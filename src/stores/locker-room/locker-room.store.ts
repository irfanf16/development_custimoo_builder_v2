import { API } from '@/services'
import type { CopyProductPayload, Locker } from '@/services/lockers/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { tryCatchApi } from '../utils'
import { toast } from 'vue-sonner'

export const useLockerRoomStore = defineStore('lockerRoomStore', () => {
  const lockers = ref<Locker[]>([])
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  async function fetchLockers() {
    isLoading.value = true
    error.value = null
    const response = await tryCatchApi(API.lockers.getLockers())
    if (response.success && response.content) {
      lockers.value = response.content.result
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
      const data = resp.content.result
      lockers.value = lockers.value.map((l: Locker) =>
        l.id === locker_id ? { ...l, ...data[0], products_fetched: true } : l
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
      setSuccessMessage('Locker created successfully')
      const data = resp.content.result
      lockers.value.push({
        collection: data.collection,
        id: data.locker.id,
        product_count: 0,
        product_thumbnails: data.locker.product_thumbnails,
        room_name: data.locker.room_name
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

    setSuccessMessage('Locker updated successfully')
    lockers.value = lockers.value.map(l => {
      if (l.id === locker.id) {
        return {
          ...locker,
          product_thumbnails: locker.product.map(prod => prod.product_front_url).slice(0, 4)
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

    setSuccessMessage('Locker deleted successfully')
    lockers.value = lockers.value.filter(locker => locker.id !== id)
  }

  //Delete Locker Products
  async function deleteProducts(product_ids: number[], locker_id: number) {
    const resp = await tryCatchApi(API.lockers.deleteProducts(product_ids, locker_id))
    if (!resp.success) {
      setError('Failed to delete products')
      return
    }

    setSuccessMessage('Products deleted successfully')
    await fetchLockerProducts(locker_id)
  }
  //Copy Locker Products
  async function copyProducts(payload: CopyProductPayload, sourceLockerId: number) {
    const sourceLocker = lockers.value.find(l => l.id === sourceLockerId)

    if (!sourceLocker) {
      setError('Source locker not found')
      return
    }

    payload.products.forEach(item => {
      const targetLocker = lockers.value.find(l => l.id === item.room_id)
      if (!targetLocker) return

      const productObj = sourceLocker.product?.find(p => p.id === item.id)
      if (!productObj) return

      targetLocker.product = [...(targetLocker.product || []), productObj]
      targetLocker.product_thumbnails = targetLocker.product
        .map(p => p.product_front_url)
        .slice(0, 4)

      // update count
      targetLocker.product_count = targetLocker.product.length
      targetLocker.products_fetched = true
    })

    const resp = await tryCatchApi(API.lockers.copyProducts(payload))

    if (!resp.success) {
      setError('Copy failed')
    }
    setSuccessMessage('Products copied successfully')
  }

  async function fetchLockerAssets(locker_id: number) {
    const resp = await tryCatchApi(API.lockers.fetchLockerAssets(locker_id))
    if (resp.success && resp.content) {
      const locker_index = lockers.value.findIndex(l => l.id === locker_id)
      if (locker_index !== -1) {
        lockers.value[locker_index] = {
          ...lockers.value[locker_index]!,
          ...resp.content.result,
          colours_fetched: true
        }
      }
    } else {
      setError('Failed to load locker assets')
    }
  }

  //error message
  function setError(errorMessage: string | null) {
    error.value = errorMessage
    toast.error(errorMessage!, {
      position: 'top-right',
      richColors: true
    })
  }
  function setSuccessMessage(successMessage: string) {
    toast.success(successMessage, {
      position: 'top-right',
      richColors: true
    })
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
    deleteProducts,
    copyProducts,
    fetchLockerAssets
  }
})
