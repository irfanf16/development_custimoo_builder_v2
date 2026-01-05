<script setup lang="ts">
  import LockerDetail from '@/components/locker-room/LockerDetail.vue'
  import LockersList from '@/components/locker-room/LockersList.vue'
  import { Dialog, DialogContent } from '@/components/ui/dialog'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import type {
    Collection,
    CollectionProduct,
    Locker,
    LockerProduct
  } from '@/services/lockers/types'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { ref, watch, computed } from 'vue'
  import LockerRoomFooter from './locker-room/LockerRoomFooter.vue'
  import LockerRoomHeader from './locker-room/LockerRoomHeader.vue'
  import CollectionList from './locker-room/CollectionList.vue'
  import CollectionDetail from './locker-room/CollectionDetail.vue'
  import { uploadPresignedFiles } from '@/lib/utils'
  import type { CustomLogo } from '@/services/logos/types'
  import { toast } from 'vue-sonner'

  type SortOption = 'lastModified' | 'alphabetical' | 'createdDate'
  type LockerTab = 'products' | 'assets' | 'colours' | 'rosters'
  type CollectionTab = 'products' | 'preview'
  const props = defineProps<{
    open: boolean
  }>()

  const emit = defineEmits([
    'update:open',
    'add-to-cart',
    'create-locker',
    'select-locker',
    'edit-locker',
    'edit-product',
    'copy-locker',
    'sort'
  ])

  const lockerRoomStore = useLockerRoomStore()
  const currentMode = ref<'list' | 'detail'>('list')
  const tab = ref<'lockers' | 'collections'>('lockers')
  const lockerTab = ref<LockerTab>('products')
  const collectionTab = ref<CollectionTab>('products')
  const sortOption = ref<SortOption>('lastModified')
  const search = ref('')
  const selectedLocker = ref<(string | number)[]>([])
  const selectedProducts = ref<LockerProduct[]>([])
  const currentLocker = ref<Locker | null>(null)
  const currentCollection = ref<Collection | null>(null)
  const lockerListRef = ref<InstanceType<typeof LockersList> | null>(null)
  // const collectionsListRef = ref<InstanceType<typeof CollectionList> | null>(null)
  const lockerDetailsRef = ref<InstanceType<typeof LockerDetail> | null>(null)
  const lockerRoomHeaderRef = ref<InstanceType<typeof LockerRoomHeader> | null>(null)
  const collectionCreationStep = ref<number>(1)
  const isCreatingCollection = ref<boolean>(false)

  // Watch the header's creatingCollection and sync it
  watch(
    () => (lockerRoomHeaderRef.value as any)?.creatingCollection,
    val => {
      if (val !== undefined) {
        isCreatingCollection.value = val
      }
    },
    { immediate: true }
  )
  const setSort = (value: SortOption) => {
    sortOption.value = value
  }
  const handleBackNavigation = () => {
    currentMode.value = 'list'
    currentLocker.value = null
    lockerTab.value = 'products'
    currentCollection.value = null
    collectionCreationStep.value = 1
    // if(!lockerRoomHeaderRef.value?.creatingCollection){
    //   selectedProducts.value = []
    // }
  }
  const getLockerDetail = async (locker: Locker) => {
    currentLocker.value = !locker.products_fetched
      ? ((await lockerRoomStore.fetchLockerProducts(locker.id)) ?? null)
      : locker
    currentMode.value = 'detail'
  }
  const getCollectionDetail = async (collection: Collection) => {
    currentCollection.value = !collection.details_fetched
      ? ((await lockerRoomStore.fetchCollectionProducts(collection.id))?.result ?? null)
      : collection
    currentMode.value = 'detail'
    tab.value = 'collections'
    collectionCreationStep.value = 2
    isCreatingCollection.value = false
    lockerRoomHeaderRef.value!.creatingCollection = false
  }
  const createLocker = () => {
    if (lockerListRef.value) {
      lockerListRef.value.createLocker()
    }
  }
  const updateLocker = (locker: Locker) => {
    lockerRoomStore.updateLockers({ ...locker })
    currentLocker.value = locker
  }
  const createCollection = () => {
    // Ensure creatingCollection flag is set
    isCreatingCollection.value = true
    if (lockerRoomHeaderRef.value) {
      ;(lockerRoomHeaderRef.value as any).creatingCollection = true
      // Clear collection name for new collection
      if (!currentCollection.value) {
        ;(lockerRoomHeaderRef.value as any).collection_name = ''
      }
    }
    currentMode.value = 'detail'
    tab.value = 'collections'
    collectionCreationStep.value = 2
    // If we're adding products to existing collection, keep currentCollection
    // Otherwise, clear it for new collection creation
    if (!currentCollection.value) {
      // This is a new collection, so we'll create it
      // Ensure currentCollection is null
      currentCollection.value = null
    } else {
      // We're adding products to existing collection, merge selected products
      const newProducts = selectedProducts.value.map((product, index) => {
        return {
          allow_description: true,
          allow_price: true,
          allow_title: true,
          product_nickname: product.product_name,
          description: product.description,
          product_note: product.description,
          product_price: '',
          product_locker_room_id: product.room_id,
          product_urls: {
            front_url: product.product_front_url,
            back_url: product.product_back_url
          },
          order_number: currentCollection.value?.collection_products?.length || 0 + index + 1
        } as CollectionProduct
      })

      // Add new products to existing collection products
      const existingProducts = currentCollection.value.collection_products || []
      currentCollection.value = {
        ...currentCollection.value,
        collection_products: [...existingProducts, ...newProducts]
      }
    }
  }

  const collectionProducts = computed(() => {
    if (currentCollection.value) {
      return currentCollection.value.collection_products
    } else {
      if (selectedProducts.value.length) {
        return selectedProducts.value.map(product => {
          return {
            allow_description: true,
            allow_price: true,
            allow_title: true,
            product_nickname: product.product_name,
            description: product.description,
            product_note: product.description,
            product_price: '',
            product_locker_room_id: product.room_id,
            product_urls: {
              front_url: product.product_front_url,
              back_url: product.product_back_url
            }
          } as CollectionProduct
        })
      } else {
        return []
      }
    }
  })

  const handleSaveCollection = async () => {
    if (!lockerRoomHeaderRef.value) return

    const collectionDetailRef = lockerDetailsRef.value as InstanceType<
      typeof CollectionDetail
    > | null
    const previewBodyRef = collectionDetailRef?.previewBodyRef

    const baseStorageUrl = import.meta.env.VITE_APP_STORAGE_URL || ''
    const collectionName = lockerRoomHeaderRef.value.collection_name || 'New Collection'
    const isEditing = !!currentCollection.value
    const collectionId = currentCollection.value?.id

    // Get logos from preview body ref or use existing collection data
    let logos: Array<{
      file: File | null
      url: string | null
      logo: CustomLogo | null
      id?: number
      isDeleted?: boolean
    }> = []

    if (previewBodyRef) {
      // Access logos from computed ref if preview body exists (use any to satisfy TS)
      const logosComputed = (previewBodyRef as any)?.logos
      if (logosComputed) {
        if (typeof logosComputed === 'object' && 'value' in logosComputed) {
          const computedValue = (logosComputed as { value: unknown }).value
          logos = Array.isArray(computedValue) ? (computedValue as typeof logos) : []
        } else if (Array.isArray(logosComputed)) {
          logos = logosComputed as typeof logos
        }
      }
    } else if (isEditing && currentCollection.value?.logos) {
      // If preview body doesn't exist and we're editing, use existing collection logos
      logos = currentCollection.value.logos.map(logo => ({
        file: null,
        url: logo.path.startsWith('http') ? logo.path : baseStorageUrl + logo.path,
        logo: null,
        id: logo.id,
        isDeleted: false
      }))
    }

    // For new collections, validate that at least one logo is uploaded
    if (!isEditing) {
      const hasLogo = logos.some(logo => (logo.file || logo.url) && !logo.isDeleted)
      if (!hasLogo) {
        toast.error('Please upload at least one logo before saving the collection', {
          position: 'top-right',
          richColors: true
        })
        // Switch to preview tab to show logo upload
        collectionTab.value = 'preview'
        return
      }
    }

    // Process logos - most should already have uploadedPath from CollectionDetail/CollectionPreviewBody
    // Only upload files that haven't been processed yet (edge case)
    const logosToUpload = logos.filter((l: any) => l?.file && !l?.uploadedPath && !l?.isDeleted)

    if (logosToUpload.length > 0) {
      // Edge case: files that weren't uploaded yet (should be rare since CollectionDetail handles File uploads)
      const logoFilesData: Array<{ name: string; type: string; size?: number }> = logosToUpload.map(
        (logo: any) => ({
          name: logo.file.name,
          type: logo.file.type || 'image/png',
          size: logo.file.size
        })
      )

      const collectionLogoPresignedUrls = await lockerRoomStore.getCollectionLogoPresignedUrls(
        collectionId || null,
        logoFilesData
      )

      if (collectionLogoPresignedUrls.success) {
        const filesToUpload: Array<{
          file: File
          presigned_url: string
          file_type: string
        }> = logosToUpload.map((logo: any, index: number) => {
          const presignedUrl = collectionLogoPresignedUrls.presigned_urls[index]
          return {
            file: logo.file,
            presigned_url: presignedUrl!.presigned_url,
            file_type: presignedUrl!.content_type
          }
        })

        const uploadResults = await uploadPresignedFiles(filesToUpload)
        if (uploadResults.every(r => r.success)) {
          // Update logos with uploaded paths
          logosToUpload.forEach((logo: any, index: number) => {
            const logoIndex = logos.findIndex(l => l === logo)
            if (logoIndex !== -1) {
              const uploadedPath = collectionLogoPresignedUrls.presigned_urls[index]!.path
              logos[logoIndex] = {
                ...logo,
                file: null,
                uploadedPath: uploadedPath,
                url: baseStorageUrl + uploadedPath
              }
            }
          })
        }
      }
    }

    // Prepare products data
    let productsData: any[] = []

    if (isEditing && collectionId) {
      // When editing, we need to merge existing products with new ones
      // First, fetch current collection to get existing products
      if (!currentCollection.value?.details_fetched) {
        await lockerRoomStore.fetchCollectionProducts(collectionId)
        const updated = lockerRoomStore.collections.find(c => c.id === collectionId)
        if (updated) currentCollection.value = updated
      }

      // Get existing products
      const existingProducts = (currentCollection.value?.collection_products || []).map(
        (p, index) => ({
          id: p.id,
          product_nickname: p.product_nickname,
          product_note: p.product_note,
          product_price: p.product_price,
          order_number: index + 1,
          product_locker_room_id: p.product_locker_room_id
        })
      )

      // Get new products from collectionProducts (these are the ones being added)
      const newProducts = collectionProducts.value
        .filter(p => !p.id) // Only new products (no id means they're newly added)
        .map((p, index) => ({
          product_nickname: p.product_nickname,
          product_note: p.product_note,
          product_price: p.product_price,
          order_number: existingProducts.length + index + 1,
          product_locker_room_id: p.product_locker_room_id
        }))

      // Merge existing and new products
      productsData = [...existingProducts, ...newProducts]
    } else {
      // Creating new collection - use all products from collectionProducts
      productsData = collectionProducts.value.map((p, index) => ({
        id: p.id,
        product_nickname: p.product_nickname,
        product_note: p.product_note,
        product_price: p.product_price,
        order_number: index + 1,
        product_locker_room_id: p.product_locker_room_id
      }))
    }

    // Get deleted logo IDs and prepare logo data
    const deletedLogoIds: number[] = []
    const logoData: Array<{ name: string; path: string; id?: number }> = []

    const logosArray = Array.isArray(logos) ? logos : []
    logosArray.forEach((logo: any, index: number) => {
      if (logo?.isDeleted && logo?.id) {
        deletedLogoIds.push(logo.id)
      } else if (!logo?.isDeleted) {
        let logoPath: string | null = null

        // Priority: uploadedPath > logo.url path > url path
        if (logo.uploadedPath) {
          // Logo was already uploaded (File or CustomLogo with existing path)
          logoPath = logo.uploadedPath
        } else if (logo.logo?.url) {
          // CustomLogo from recent logos - extract path from URL
          logoPath = logo.logo.url.startsWith('http')
            ? logo.logo.url.replace(baseStorageUrl, '')
            : logo.logo.url
        } else if (logo.url) {
          // Fallback: extract path from URL
          logoPath = logo.url.startsWith('http') ? logo.url.replace(baseStorageUrl, '') : logo.url
        }

        if (logoPath) {
          const logoEntry: { name: string; path: string; id?: number } = {
            name: `logo-${index + 1}`,
            path: logoPath
          }
          // Include logo ID only when editing a collection and logo has ID
          if (isEditing && collectionId && logo.id) {
            logoEntry.id = logo.id
          }
          logoData.push(logoEntry)
        }
      }
    })

    // Create manual FormData
    const formData = new FormData()
    formData.append('name', collectionName)
    formData.append('link', currentCollection.value?.link || '')
    formData.append('collection_logos_data', JSON.stringify(logoData))
    formData.append('deleted_logos_ids', JSON.stringify(deletedLogoIds))

    // Add products array
    productsData.forEach(product => {
      formData.append('products[]', JSON.stringify(product))
    })

    if (isEditing && collectionId) {
      formData.append('_method', 'PUT')
      await lockerRoomStore.updateCollection(collectionId, formData)
      await lockerRoomStore.fetchCollectionProducts(collectionId)
      currentCollection.value = lockerRoomStore.collections.find(c => c.id === collectionId) || null
    } else {
      await lockerRoomStore.saveCollection(formData)
      handleBackNavigation()
    }
  }
  const handleRemoveProduct = (index: number) => {
    if (currentCollection.value) {
      // Remove from collection products
      const updatedProducts = [...collectionProducts.value]
      updatedProducts.splice(index, 1)
      // Update the collection
      currentCollection.value = {
        ...currentCollection.value,
        collection_products: updatedProducts
      }
    }
  }

  const handleLogoRemoved = (_index: number, _logoId?: number) => {
    // Logo removal is handled in CollectionPreviewBody
    // The deleted logo ID will be tracked when saving
    // This handler is here to satisfy the emit requirement
  }

  const handleAddToCollection = async (targetCollection: Collection) => {
    if (!currentCollection.value) return

    // Fetch target collection details if needed
    let collectionToUpdate = targetCollection
    if (!targetCollection.details_fetched) {
      await lockerRoomStore.fetchCollectionProducts(targetCollection.id)
      const updated = lockerRoomStore.collections.find(c => c.id === targetCollection.id)
      if (updated) collectionToUpdate = updated
    }

    // Merge products from current collection to target collection
    const currentProducts = collectionProducts.value.map((p, index) => ({
      id: p.id || undefined,
      product_nickname: p.product_nickname,
      product_note: p.product_note,
      product_price: p.product_price,
      order_number: (collectionToUpdate.collection_products?.length || 0) + index + 1,
      product_locker_room_id: p.product_locker_room_id
    }))

    const existingProducts = (collectionToUpdate.collection_products || []).map((p, index) => ({
      id: p.id,
      product_nickname: p.product_nickname,
      product_note: p.product_note,
      product_price: p.product_price,
      order_number: index + 1,
      product_locker_room_id: p.product_locker_room_id
    }))

    const allProducts = [...existingProducts, ...currentProducts]

    // Create manual FormData
    const formData = new FormData()
    formData.append('name', collectionToUpdate.name)
    formData.append('link', collectionToUpdate.link || '')
    formData.append(
      'collection_logos_data',
      JSON.stringify(
        (collectionToUpdate.logos || []).map(logo => ({
          name: logo.name,
          path: logo.path
        }))
      )
    )
    formData.append('deleted_logos_ids', JSON.stringify([]))
    formData.append('_method', 'PUT')
    // Add products array
    allProducts.forEach(product => {
      formData.append('products[]', JSON.stringify(product))
    })
    await lockerRoomStore.updateCollection(collectionToUpdate.id, formData)

    // Refresh target collection
    await lockerRoomStore.fetchCollectionProducts(targetCollection.id)
    const updatedCollection = lockerRoomStore.collections.find(c => c.id === targetCollection.id)
    if (updatedCollection) {
      currentCollection.value = updatedCollection
      getCollectionDetail(updatedCollection)
    }
  }

  const handleAddProductsToCollection = () => {
    // Switch to lockers tab and enable collection creation mode
    // But keep track that we're adding to existing collection
    isCreatingCollection.value = true
    lockerRoomHeaderRef.value!.creatingCollection = true
    tab.value = 'lockers'
    currentMode.value = 'list'
    collectionCreationStep.value = 1
    // Note: currentCollection is still set, so isEditingCollection will work correctly
  }

  const handleAddToCollectionFromLocker = async (targetCollection: Collection) => {
    if (!currentLocker.value || selectedProducts.value.length === 0) return

    // Convert selected products to collection products format
    const productsToAdd = selectedProducts.value.map((product: LockerProduct) => ({
      allow_description: true,
      allow_price: true,
      allow_title: true,
      product_nickname: product.product_name,
      description: product.description,
      product_note: product.description,
      product_price: '',
      product_locker_room_id: product.room_id,
      product_urls: {
        front_url: product.product_front_url,
        back_url: product.product_back_url
      }
    }))

    // Fetch target collection if needed
    let collectionToUpdate = targetCollection
    if (!targetCollection.details_fetched) {
      await lockerRoomStore.fetchCollectionProducts(targetCollection.id)
      const updated = lockerRoomStore.collections.find(c => c.id === targetCollection.id)
      if (updated) collectionToUpdate = updated
    }

    // Merge products
    const existingProducts = (collectionToUpdate.collection_products || []).map((p, index) => ({
      id: p.id,
      product_nickname: p.product_nickname,
      product_note: p.product_note,
      product_price: p.product_price,
      order_number: index + 1,
      product_locker_room_id: p.product_locker_room_id
    }))

    const newProducts = productsToAdd.map(
      (p, index) =>
        ({
          product_nickname: p.product_nickname,
          product_note: p.product_note,
          product_price: p.product_price,
          order_number: existingProducts.length + index + 1,
          product_locker_room_id: p.product_locker_room_id,
          product_urls: {
            front_url: p.product_urls.front_url,
            back_url: p.product_urls.back_url
          }
        }) as CollectionProduct
    )

    const allProducts = [...existingProducts, ...newProducts]

    // Create manual FormData
    const formData = new FormData()
    formData.append('name', collectionToUpdate.name)
    formData.append('link', collectionToUpdate.link || '')
    formData.append(
      'collection_logos_data',
      JSON.stringify(
        (collectionToUpdate.logos || []).map(logo => ({
          name: logo.name,
          path: logo.path
        }))
      )
    )
    formData.append('deleted_logos_ids', JSON.stringify([]))
    formData.append('_method', 'PUT')
    // Add products array
    allProducts.forEach(product => {
      formData.append('products[]', JSON.stringify(product))
    })

    await lockerRoomStore.updateCollection(collectionToUpdate.id, formData)

    // Refresh collection
    await lockerRoomStore.fetchCollectionProducts(targetCollection.id)
    toast.success('Products added to collection successfully', {
      position: 'top-right',
      richColors: true
    })

    // Clear selection
    selectedProducts.value = []
  }

  watch(
    () => props.open,
    newVal => {
      if (!newVal) {
        currentMode.value = 'list'
        tab.value = 'lockers'
        lockerTab.value = 'products'
        sortOption.value = 'lastModified'
        search.value = ''
        selectedLocker.value = []
        selectedProducts.value = []
      }
    }
  )
</script>

<template>
  <Dialog :open="open" variant="large" @update:open="emit('update:open', $event)">
    <DialogContent variant="large" class="flex flex-col w-full">
      <LockerRoomHeader
        ref="lockerRoomHeaderRef"
        :current-collection="currentCollection"
        :current-mode="currentMode"
        :sort-option="sortOption"
        :current-locker="currentLocker"
        :main-tab="tab"
        :locker-detail-tab="lockerTab"
        :collection-tab="collectionTab"
        :creating-collection="isCreatingCollection"
        :collection-creation-step="collectionCreationStep"
        @change-current-locker="getLockerDetail"
        @change-current-collection="getCollectionDetail"
        @sort="setSort"
        @search="(val: string) => (search = val)"
        @tab-change="(val: 'lockers' | 'collections') => (tab = val)"
        @back="handleBackNavigation"
        @change-locker-tab="(val: LockerTab) => (lockerTab = val)"
        @change-collection-tab="(val: CollectionTab) => (collectionTab = val)"
        @create-locker="createLocker"
        @update-locker="updateLocker"
        @update-collection-name="
          (name: string) => {
            if (currentCollection) {
              currentCollection = { ...currentCollection, name }
            }
          }
        "
        @create-collection="
          () => {
            // If we're already in detail mode with products selected, just set creation flags
            // Otherwise, go to list mode to select locker
            if (currentMode === 'detail' && currentLocker && selectedProducts.length > 0) {
              lockerRoomHeaderRef!.creatingCollection = true
              collectionCreationStep = 1
              currentCollection = null
            } else {
              lockerRoomHeaderRef!.creatingCollection = true
              tab = 'lockers'
              currentMode = 'list'
              currentCollection = null
              collectionCreationStep = 1
            }
          }
        "
      />
      <ScrollArea class="flex-1 overflow-y-auto">
        <div class="relative w-full h-full">
          <Transition name="slide-horizontal" mode="out-in">
            <div
              v-if="tab === 'lockers' && currentMode === 'list'"
              key="locker-list"
              class="absolute inset-0"
            >
              <LockersList
                ref="lockerListRef"
                :is-creating-collection="lockerRoomHeaderRef?.creatingCollection ?? false"
                :search="search"
                :sort="sortOption"
                @select-locker="selectedLocker = $event"
                @open-locker="getLockerDetail"
              />
            </div>

            <div
              v-else-if="tab === 'collections' && currentMode === 'list'"
              key="collections"
              class="absolute inset-0"
            >
              <CollectionList
                ref="collectionsListRef"
                :search="search"
                :sort="sortOption"
                @open-collection="getCollectionDetail"
              />
            </div>

            <div
              v-else-if="tab === 'lockers' && currentMode === 'detail' && currentLocker"
              key="locker-detail"
              class="absolute inset-0"
            >
              <LockerDetail
                ref="lockerDetailsRef"
                :is-creating-collection="lockerRoomHeaderRef?.creatingCollection ?? false"
                :locker-tab="lockerTab"
                :locker="currentLocker"
                :sort="sortOption"
                :search="search"
                :pre-selected-products="selectedProducts"
                @select-product="
                  (locker_products: LockerProduct[]) => (selectedProducts = locker_products)
                "
                @edit-product="payload => emit('edit-product', payload)"
              />
            </div>

            <div
              v-else-if="tab === 'collections' && currentMode === 'detail'"
              key="collection-detail"
              class="absolute inset-0"
            >
              <CollectionDetail
                ref="lockerDetailsRef"
                :is-creating-collection="lockerRoomHeaderRef?.creatingCollection ?? false"
                :collection-tab="collectionTab"
                :collection="currentCollection"
                :pre-selected-products="collectionProducts"
                :sort="sortOption"
                @select-product="
                  (locker_products: LockerProduct[]) => (selectedProducts = locker_products)
                "
                @remove-product="handleRemoveProduct"
                @logo-removed="handleLogoRemoved"
              />
            </div>
          </Transition>
        </div>
      </ScrollArea>

      <LockerRoomFooter
        v-if="
          (tab === 'collections' && lockerRoomHeaderRef!.creatingCollection) ||
          lockerTab === 'products' ||
          lockerRoomHeaderRef?.creatingCollection
        "
        :current-collection="currentCollection"
        :locker-products-ref="lockerDetailsRef?.lockerProductsRef"
        :current-tab="tab"
        :current-locker="currentLocker"
        :current-mode="currentMode"
        :details-tab="lockerTab"
        :selected-products="selectedProducts"
        :selected-lockers="selectedLocker"
        :is-creating-collection="lockerRoomHeaderRef?.creatingCollection ?? false"
        :collection-creation-step="collectionCreationStep"
        @back="handleBackNavigation"
        @cancel-collection-creation="
          () => {
            currentMode = 'list'
            currentLocker = null
            tab = 'collections'
            lockerTab = 'products'
            selectedProducts = []
            lockerRoomHeaderRef!.creatingCollection = false
            collectionProducts = []
          }
        "
        @create-collection="createCollection"
        @save-collection="handleSaveCollection"
        @add-to-collection="
          collection => {
            if (tab === 'lockers') {
              handleAddToCollectionFromLocker(collection)
            } else {
              handleAddToCollection(collection)
            }
          }
        "
        @add-products-to-collection="handleAddProductsToCollection"
      />
    </DialogContent>
  </Dialog>
</template>
