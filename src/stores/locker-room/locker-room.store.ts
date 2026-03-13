import { API } from '@/services'
import type {
  Collection,
  CollectionLogoPresignedUrlsResponse,
  CopyProductPayload,
  Locker,
  LockerProduct,
  SaveLockerProductPayload,
  SignedUrlResponse,
  LockerRoomsWithColors
} from '@/services/lockers/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useTryCatchApi } from '@/composables/useTryCatchApi'
import { toast } from 'vue-sonner'

export const useLockerRoomStore = defineStore('lockerRoomStore', () => {
  // ===== DEPENDENCIES =====
  const { tryCatchApi } = useTryCatchApi({ defaultProperties: { store: 'lockerRoomStore' } })

  // ===== STATE =====
  const lockers = ref<Locker[]>([])
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const collections = ref<Collection[]>([])
  const lockerRoomsWithColors = ref<LockerRoomsWithColors[]>([])
  // Track if we're editing a locker product
  const editingLockerProductId = ref<number | null>(null)
  const editingLockerId = ref<number | null>(null)
  const editingLockerProduct = ref<LockerProduct | null>(null)
  const isDeletingProducts = ref<boolean>(false)
  const isCopyingProducts = ref<boolean>(false)

  /** When set, opening the locker browser should switch to this tab when user selects a locker (used from Colors/Logos/Roster steps). */
  const openLockerWithIntent = ref<{
    tab: 'products' | 'assets' | 'colours' | 'rosters'
  } | null>(null)

  function setOpenLockerWithIntent(tab: 'products' | 'assets' | 'colours' | 'rosters') {
    openLockerWithIntent.value = { tab }
  }

  function clearOpenLockerWithIntent() {
    openLockerWithIntent.value = null
  }

  //lockers methods
  async function fetchLockers() {
    isLoading.value = true
    error.value = null
    const response = await tryCatchApi(API.lockers.getLockers(), {
      operation: 'fetchLockers'
    })
    if (response.success && response.content) {
      lockers.value = response.content.result
    } else {
      setError('Failed to load lockers')
    }
    isLoading.value = false
  }

  /** Fetch lockers in background without showing loader. Use when opening locker browser to refresh list. */
  async function fetchLockersInBackground() {
    const response = await tryCatchApi(API.lockers.getLockers(), {
      operation: 'fetchLockers'
    })
    if (response.success && response.content) {
      lockers.value = response.content.result
    }
  }
  /** Core fetch + merge; no loader, no error toast. Used by fetchLockerProducts and for background refresh after copy. */
  async function fetchLockerProductsCore(locker_id: number): Promise<Locker | undefined> {
    const resp = await tryCatchApi(API.lockers.getLockerProducts(locker_id), {
      operation: 'fetchLockerProducts',
      locker_id
    })
    if (resp.success && resp.content) {
      const data = resp.content.result
      lockers.value = lockers.value.map((l: Locker) =>
        l.id === locker_id ? { ...l, ...data[0], products_fetched: true } : l
      )
      return data[0]
    }
    return undefined
  }

  async function fetchLockerProducts(locker_id: number): Promise<Locker | undefined> {
    isLoading.value = true
    error.value = null
    const result = await fetchLockerProductsCore(locker_id)
    if (!result) {
      setError('Failed to load locker products')
    }
    isLoading.value = false
    return result
  }

  async function createLocker(name: string): Promise<Locker | null> {
    isLoading.value = true
    error.value = null
    const resp = await tryCatchApi(API.lockers.createLocker(name), {
      operation: 'createLocker'
    })
    if (resp.success && resp.content) {
      setSuccessMessage('Locker created successfully')
      const data = resp.content.result
      const created: Locker = {
        collection: data.collection,
        id: data.locker.id,
        product_count: 0,
        product_thumbnails: data.locker.product_thumbnails,
        room_name: data.locker.room_name,
        updated_at: data.locker.updated_at,
        created_at: data.locker.created_at
      } as Locker
      lockers.value.push(created)
      isLoading.value = false
      return created
    } else {
      setError('Failed to create locker')
    }
    isLoading.value = false
    return null
  }

  async function updateLockers(locker: Locker) {
    isLoading.value = true
    const resp = await tryCatchApi(
      API.lockers.updateLocker({ id: locker.id, room_name: locker.room_name }),
      {
        operation: 'updateLockers',
        locker_id: locker.id
      }
    )
    if (!resp.success) {
      setError(resp.message || 'Failed to update locker')
      isLoading.value = false
      return
    }

    setSuccessMessage('Locker updated successfully')
    lockers.value = lockers.value.map(l => {
      if (l.id !== locker.id) return l
      const productList = locker.product ?? l.product ?? []
      const product_thumbnails = productList
        .map((prod: LockerProduct) => prod.product_front_url)
        .slice(0, 4)
      isLoading.value = false
      return {
        ...l,
        ...locker,
        product_thumbnails,
        updated_at: new Date().toISOString()
      }
    })
  }

  async function deleteLocker(id: number) {
    const resp = await tryCatchApi(API.lockers.deleteLocker(id), {
      operation: 'deleteLocker',
      locker_id: id
    })
    if (!resp.success) {
      setError('Failed to delete locker')
      return
    }

    setSuccessMessage('Locker deleted successfully')
    lockers.value = lockers.value.filter(locker => locker.id !== id)
    // Remove associated collections from frontend
    collections.value = collections.value.filter(collection => collection.room_id !== id)
  }

  async function fetchLockersWithcolors() {
    const resp = await tryCatchApi(API.lockers.fetchLockersWithcolors(), {
      operation: 'fetchLockersWithcolors'
    })
    if (resp.success && resp.content) {
      lockerRoomsWithColors.value = resp.content
    }
  }
  //Delete Locker Products
  async function deleteProducts(product_ids: number[], locker_id: number) {
    isDeletingProducts.value = true
    try {
      const resp = await tryCatchApi(API.lockers.deleteProducts(product_ids, locker_id), {
        operation: 'deleteProducts',
        locker_id
      })
      if (!resp.success) {
        setError('Failed to delete products')
        return
      }

      setSuccessMessage('Products deleted successfully')
      await fetchLockerProducts(locker_id)
      await fetchLockerAssets(locker_id)
      // Sync thumbnails and count from product array so list shows correct state after delete
      lockers.value = lockers.value.map(l => {
        if (l.id !== locker_id) return l
        const productList = l.product ?? []
        return {
          ...l,
          product_count: productList.length,
          product_thumbnails: productList.map(p => p.product_front_url).slice(0, 4),
          updated_at: new Date().toISOString()
        }
      })
    } finally {
      isDeletingProducts.value = false
    }
  }
  //Copy Locker Products. Returns true on success, false on failure.
  async function copyProducts(
    payload: CopyProductPayload,
    sourceLockerId: number
  ): Promise<boolean> {
    const sourceLocker = lockers.value.find(l => l.id === sourceLockerId)

    if (!sourceLocker) {
      setError('Source locker not found')
      return false
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

    isCopyingProducts.value = true
    try {
      const resp = await tryCatchApi(API.lockers.copyProducts(payload), {
        operation: 'copyProducts'
      })
      console.log('Copy products response:', resp)
      if (!resp.success) {
        setError(resp.message || 'Copy failed')
        return false
      }
      setSuccessMessage('Products copied successfully')
      const targetLockerIds = [...new Set(payload.products.map(p => p.room_id))]
      Promise.all(targetLockerIds.map(id => fetchLockerProductsCore(id))).catch(() => {})
      return true
    } finally {
      isCopyingProducts.value = false
    }
  }

  async function fetchLockerAssets(locker_id: number) {
    const resp = await tryCatchApi(API.lockers.fetchLockerAssets(locker_id), {
      operation: 'fetchLockerAssets',
      locker_id
    })
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

  async function saveDesignToLocker(
    payload: SaveLockerProductPayload,
    locker_id: number,
    front_image: string
  ): Promise<boolean> {
    const resp = await tryCatchApi(API.lockers.saveDesign(payload), {
      operation: 'saveDesignToLocker'
    })
    if (!resp.success) {
      const errors = Object.values(resp.axiosError?.response?.data.errors || {})
      if (errors.length > 0) {
        errors.forEach((error: string[] | string) => {
          if (Array.isArray(error)) {
            setError(error[0]!)
          } else {
            setError(error)
          }
        })
      } else {
        setError('Failed to save design')
      }
      return false
    }
    lockers.value = lockers.value.map(locker => {
      if (locker.id !== locker_id) return locker
      const thumbnails = locker.product_thumbnails ?? []
      const newThumbnails =
        thumbnails.length < 4 ? [...thumbnails, front_image].slice(0, 4) : thumbnails
      return {
        ...locker,
        product_thumbnails: newThumbnails,
        product_count: (locker.product_count ?? 0) + 1,
        updated_at: new Date().toISOString()
      }
    })
    setSuccessMessage('Design saved successfully')
    await fetchLockerProducts(locker_id)
    await fetchLockerAssets(locker_id)
    // Sync thumbnails from product array so new product image is reflected in the list
    lockers.value = lockers.value.map(l => {
      if (l.id !== locker_id || !l.product?.length) return l
      return {
        ...l,
        product_thumbnails: l.product.map(p => p.product_front_url).slice(0, 4)
      }
    })
    return true
  }

  async function updateLockerProduct(
    payload: SaveLockerProductPayload,
    locker_id: number
  ): Promise<boolean> {
    // For updating, pass locker_id to use route: locker-products/{locker_id}
    const resp = await tryCatchApi(API.lockers.saveDesign(payload, locker_id), {
      operation: 'updateLockerProduct'
    })
    if (!resp.success) {
      setError('Failed to update design')
      return false
    }
    // Refresh locker products to get updated data
    await fetchLockerProducts(locker_id)
    await fetchLockerAssets(locker_id)
    // Sync thumbnails from product array so updated product image is reflected in the list
    lockers.value = lockers.value.map(l => {
      if (l.id !== locker_id || !l.product?.length) return l
      return {
        ...l,
        product_thumbnails: l.product.map(p => p.product_front_url).slice(0, 4),
        updated_at: new Date().toISOString()
      }
    })
    setSuccessMessage('Design updated successfully')
    return true
  }

  /**
   * Set editing locker product state
   */
  function setEditingLockerProduct(
    lockerProductId: number,
    lockerId: number,
    lockerProduct?: LockerProduct
  ) {
    editingLockerProductId.value = lockerProductId
    editingLockerId.value = lockerId
    editingLockerProduct.value = lockerProduct || null
  }

  /**
   * Clear editing locker product state
   */
  function clearEditingLockerProduct() {
    editingLockerProductId.value = null
    editingLockerId.value = null
    editingLockerProduct.value = null
  }

  /**
   * Check if we're currently editing a locker product
   */
  const isEditingLockerProduct = computed(() => {
    return editingLockerProductId.value !== null && editingLockerId.value !== null
  })

  // collection methods
  async function fetchCollections() {
    isLoading.value = true
    error.value = null
    const resp = await tryCatchApi(API.lockers.getCollections(), {
      operation: 'fetchCollections'
    })
    if (resp.success && resp.content) {
      collections.value = resp.content.result.map(collection => ({
        ...collection,
        details_fetched: false
      }))
    } else {
      setError('Failed to load collections')
    }
    isLoading.value = false
  }

  async function fetchCollectionProducts(collection_id: number) {
    isLoading.value = true
    error.value = null
    const resp = await tryCatchApi(API.lockers.getCollectionProducts(collection_id), {
      operation: 'fetchCollectionProducts',
      collection_id
    })
    if (resp.success && resp.content) {
      let local_collection
      collections.value = collections.value.map(c => {
        if (c.id === collection_id) {
          local_collection = {
            ...c,
            ...resp.content.result,
            details_fetched: true,
            collection_products: resp.content.result.collection_products
          }
          return local_collection
        } else {
          return c
        }
      })
      isLoading.value = false
      return local_collection
    } else {
      setError('Failed to load collection products')
      isLoading.value = false
      return null
    }
  }

  async function saveCollection(formData: FormData) {
    isLoading.value = true
    error.value = null
    const resp = await tryCatchApi(API.lockers.saveCollection(formData), {
      operation: 'saveCollection'
    })
    if (resp.success && resp.content) {
      await fetchCollections()
    } else {
      setError('Failed to save collection')
      isLoading.value = false
      return null
    }
  }

  async function updateCollection(collection_id: number, formData: FormData) {
    isLoading.value = true
    error.value = null
    const resp = await tryCatchApi(API.lockers.updateCollection(collection_id, formData))
    if (resp.success && resp.content) {
      await fetchCollections()
      isLoading.value = false
      return resp.content
    } else {
      setError('Failed to update collection')
      isLoading.value = false
      return null
    }
  }

  async function deleteCollection(id: number) {
    const resp = await tryCatchApi(API.lockers.deleteCollection(id), {
      operation: 'deleteCollection',
      collection_id: id
    })
    if (!resp.success) {
      setError('Failed to delete locker')
      return
    }

    setSuccessMessage('Collection deleted successfully')
    collections.value = collections.value.filter(collection => collection.id !== id)
  }

  function setCollectionShareUrl(collectionId: number, shareUrl: string) {
    collections.value = collections.value.map(c =>
      c.id === collectionId ? { ...c, link: shareUrl, shared_url: shareUrl } : c
    )
  }

  // to get signed Image URL
  async function getSignedUrl(locker_id: number): Promise<SignedUrlResponse | undefined> {
    return (
      await tryCatchApi(API.lockers.getSignedUrl(locker_id), {
        operation: 'getSignedUrl',
        locker_id
      })
    ).content?.result
  }

  async function getCollectionLogoPresignedUrls(
    collection_id: number | null,
    logoFiles: Array<{ name: string; type: string; size?: number }>
  ): Promise<CollectionLogoPresignedUrlsResponse> {
    const resp = await tryCatchApi(
      API.lockers.getCollectionLogoPresignedUrls(collection_id, logoFiles)
    )
    if (resp.success && resp.content) {
      return resp.content
    } else {
      setError('Failed to get collection logo presigned URLs')
      return {
        presigned_urls: [],
        success: false
      }
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
  function resetLockerState() {
    lockers.value = []
    collections.value = []
    editingLockerProductId.value = null
    editingLockerId.value = null
    editingLockerProduct.value = null
  }
  return {
    lockers,
    isLoading,
    error,
    collections,
    editingLockerProductId,
    editingLockerId,
    editingLockerProduct,
    isDeletingProducts,
    isCopyingProducts,
    isEditingLockerProduct,
    lockerRoomsWithColors,
    openLockerWithIntent,
    setOpenLockerWithIntent,
    clearOpenLockerWithIntent,
    //functions
    fetchLockers,
    fetchLockersInBackground,
    fetchLockerProducts,
    fetchLockerProductsCore,
    createLocker,
    updateLockers,
    deleteLocker,
    resetLockerState,
    //Products Endpoint
    deleteProducts,
    copyProducts,
    fetchLockerAssets,
    saveDesignToLocker,
    updateLockerProduct,
    setEditingLockerProduct,
    clearEditingLockerProduct,
    fetchLockersWithcolors,
    //collection methods
    fetchCollections,
    fetchCollectionProducts,
    saveCollection,
    updateCollection,
    deleteCollection,
    setCollectionShareUrl,
    //get s3 signed URL
    getSignedUrl,
    getCollectionLogoPresignedUrls
  }
})
