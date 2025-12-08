
import { API } from '@/services'
import type { Locker } from '@/services/lockers/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLockerRoomStore = defineStore('lockerRoomStore', () => {

  const lockers = ref<Locker[]>([])
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null)

  async function fetchLockers() {
    isLoading.value = true
    error.value = null
    try {
      const response = await API.lockers.getLockers()
      isLoading.value = false;
      lockers.value = response;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load dashboard'
    } finally {
      isLoading.value = false
    }
  }
  async function fetchLockerProducts(locker_id: number): Promise<Locker | undefined> {

    isLoading.value = true
    error.value = null
    try {
      const response = await API.lockers.getLockerProducts(locker_id)
      lockers.value = lockers.value.map(l => l.id === locker_id ? { ...l, ...response[0], details_fetched: true } : l)
      isLoading.value = false
      return response[0];
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load dashboard'
    } finally {
      isLoading.value = false
    }
  }

  async function createLocker(name: string) {

    isLoading.value = true
    error.value = null
    try {
      const { data } = await API.lockers.createLocker(name)
      lockers.value.push({
        collection: data.collection,
        id: data.id,
        product_count: 0,
        products: data.products,
        room_name: data.room_name
      } as Locker)

      isLoading.value = false
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to create locker'
    } finally {
      isLoading.value = false
    }
  }

  async function updateLockers(locker: Locker) {
    await API.lockers.updateLocker({ id: locker.id, room_name: locker.room_name })
    lockers.value = lockers.value.map(l => {
      if (l.id === locker.id) {
        return { ...locker, products: locker.product.map(prod => prod.product_front_url).slice(0, 4) };
      }
      else {
        return l;
      }
    })
  }

  async function deleteLocker(id: number) {
    await API.lockers.deleteLocker(id);
    lockers.value = lockers.value.filter(locker => locker.id !== id);
  }


  //Delete Locker Products
  async function deleteProducts(product_ids: number[], locker_id: number) {
    await API.lockers.deleteProducts(product_ids);
    await fetchLockerProducts(locker_id)
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
