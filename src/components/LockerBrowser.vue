<script setup lang="ts">
  import LockerDetail from '@/components/locker-room/LockerDetail.vue'
  import LockersList from '@/components/locker-room/LockersList.vue'
  import { Dialog, DialogContent } from '@/components/ui/dialog'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import type {
    Collection,
    CollectionProduct,
    Locker,
    LockerCollectionMutationResponse,
    LockerProduct
  } from '@/services/lockers/types'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { ref, watch, computed, provide, unref } from 'vue'
  import { storeToRefs } from 'pinia'
  import LockerRoomFooter from './locker-room/LockerRoomFooter.vue'
  import LockerRoomHeader from './locker-room/LockerRoomHeader.vue'
  import CollectionList from './locker-room/CollectionList.vue'
  import CollectionDetail from './locker-room/CollectionDetail.vue'
  import { useScrollAreaFill } from '@/composables/useScrollAreaFill'
  import { uploadPresignedFiles } from '@/lib/utils'
  import type { CustomLogo } from '@/services/logos/types'
  import { toast } from 'vue-sonner'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    msg_upload_logo_before_collection,
    msg_collection_name_required,
    msg_products_added_to_collection,
    msg_collection_partial_add_unavailable
  } from '@/paraglide/messages'

  type SortOption = 'lastModified' | 'alphabetical' | 'createdDate'
  type LockerTab = 'products' | 'assets' | 'colours' | 'rosters'
  type CollectionTab = 'products' | 'preview'
  const props = withDefaults(
    defineProps<{
      open: boolean
      /** When set and browser opens, navigate to this locker's detail view (e.g. after saving a design). */
      initialLockerId?: number | null
      /** When set, opening a locker will switch to this tab (e.g. from Colors/Logos/Roster "Choose from locker"). */
      initialTab?: LockerTab | null
    }>(),
    { initialLockerId: null, initialTab: null }
  )

  const emit = defineEmits([
    'clear-initial-tab',
    'update:open',
    'add-to-cart',
    'create-locker',
    'select-locker',
    'edit-locker',
    'edit-product',
    'copy-locker',
    'sort',
    'initial-locker-opened'
  ])

  const lockerRoomStore = useLockerRoomStore()
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  /** Full success toast, or a single combined message when some locker products were not salable. */
  function toastCollectionAddOrMergeMaybePartial(
    body: LockerCollectionMutationResponse | null | undefined,
    fullSuccessMessage: string
  ) {
    const unavailable = body?.result?.unavailable_products
    if (unavailable?.length) {
      const names = unavailable
        .map(u => (u.product_nickname || '').trim() || `#${u.product_locker_room_id}`)
        .join(', ')
      toast.success(msg_collection_partial_add_unavailable({ names }, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
    } else {
      toast.success(fullSuccessMessage, { position: 'top-right', richColors: true })
    }
  }

  function toastCollectionSavePartialOnly(
    body: LockerCollectionMutationResponse | null | undefined
  ) {
    const unavailable = body?.result?.unavailable_products
    if (!unavailable?.length) return
    const names = unavailable
      .map(u => (u.product_nickname || '').trim() || `#${u.product_locker_room_id}`)
      .join(', ')
    toast.success(msg_collection_partial_add_unavailable({ names }, { locale: locale.value }), {
      position: 'top-right',
      richColors: true
    })
  }
  const { lockers: storeLockers } = storeToRefs(lockerRoomStore)
  const currentMode = ref<'list' | 'detail'>('list')

  provide('closeLockerBrowser', () => emit('update:open', false))
  const tab = ref<'lockers' | 'collections'>('lockers')
  const lockerTab = ref<LockerTab>('products')
  const collectionTab = ref<CollectionTab>('products')
  const sortOption = ref<SortOption>('lastModified')
  const search = ref('')
  const selectedLocker = ref<(string | number)[]>([])
  const selectedProductsByLocker = ref<Record<number, number[]>>({})
  const selectedProducts = ref<LockerProduct[]>([])
  const currentLocker = ref<Locker | null>(null)
  const currentCollection = ref<Collection | null>(null)
  const lockerListRef = ref<InstanceType<typeof LockersList> | null>(null)
  // const collectionsListRef = ref<InstanceType<typeof CollectionList> | null>(null)
  const lockerDetailsRef = ref<InstanceType<typeof LockerDetail> | null>(null)
  const lockerRoomHeaderRef = ref<InstanceType<typeof LockerRoomHeader> | null>(null)
  const lockerShellRef = ref<HTMLElement | null>(null)
  const lockerHeaderMeasureRef = ref<HTMLElement | null>(null)
  const lockerFooterMeasureRef = ref<HTMLElement | null>(null)
  const { scrollAreaStyle: lockerScrollAreaStyle } = useScrollAreaFill({
    shellRef: lockerShellRef,
    headerRef: lockerHeaderMeasureRef,
    footerRef: lockerFooterMeasureRef
  })
  const collectionCreationStep = ref<number>(1)
  const isCreatingCollection = ref<boolean>(false)
  const editingCollectionName = ref<boolean>(false)
  const isSavingCollection = ref<boolean>(false)
  const isAddingToCollection = ref<boolean>(false)
  /** True when we entered "Add products" from a collection; selection is the source of truth and save replaces collection products. */
  const addedProductsFlowFromCollection = ref<boolean>(false)

  /** When creating a new collection, holds the editable product list (price, description, allow_*) so save uses it. */
  const workingCollectionProducts = ref<CollectionProduct[]>([])

  /** Build a minimal LockerProduct-like object from a collection product for selection display and sync (e.g. when entering add-products). */
  function collectionProductToStubLockerProduct(cp: CollectionProduct): LockerProduct {
    return {
      id: cp.product_locker_room_id,
      name: cp.product_nickname,
      product_name: cp.product_nickname,
      product_front_url: cp.product_urls?.front_url ?? '',
      product_back_url: cp.product_urls?.back_url ?? '',
      description: cp.product_note ?? '',
      product_note: cp.product_note ?? ''
    } as unknown as LockerProduct
  }

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
    // During collection creation step 1, back from locker detail = return to locker list only (stay in creation)
    const creating = lockerRoomHeaderRef.value?.creatingCollection ?? isCreatingCollection.value
    if (
      creating &&
      collectionCreationStep.value === 1 &&
      currentMode.value === 'detail' &&
      currentLocker.value
    ) {
      currentMode.value = 'list'
      currentLocker.value = null
      lockerTab.value = 'products'
      return
    }
    currentMode.value = 'list'
    currentLocker.value = null
    lockerTab.value = 'products'
    currentCollection.value = null
    collectionCreationStep.value = 1
    isCreatingCollection.value = false
    addedProductsFlowFromCollection.value = false
    if (lockerRoomHeaderRef.value) {
      lockerRoomHeaderRef.value.creatingCollection = false
    }
  }
  function aggregateSelectedProductsFromStore(): LockerProduct[] {
    const result: LockerProduct[] = []
    for (const lockerId of selectedLocker.value) {
      const locker = storeLockers.value.find(l => l.id === Number(lockerId))
      if (!locker?.product?.length) continue
      const ids = selectedProductsByLocker.value[locker.id] ?? []
      if (ids.length === 0) {
        result.push(...locker.product)
      } else {
        result.push(...locker.product.filter((p: LockerProduct) => ids.includes(p.id)))
      }
    }
    return result
  }

  const getLockerDetail = async (locker: Locker) => {
    if (!locker.products_fetched) {
      currentLocker.value = (await lockerRoomStore.fetchLockerProducts(locker.id)) ?? null
    } else {
      currentLocker.value = locker
      void lockerRoomStore.fetchLockerProductsCore(locker.id).then(updated => {
        if (updated) currentLocker.value = updated
      })
    }
    currentMode.value = 'detail'
    search.value = ''
    if (props.initialTab) {
      lockerTab.value = props.initialTab
      emit('clear-initial-tab')
    }
    if (!(isCreatingCollection.value && currentCollection.value)) {
      selectedProducts.value = aggregateSelectedProductsFromStore()
    }
  }

  // When the locker browser opens, fetch fresh data in background (no loader) so the list updates without blocking UI
  watch(
    () => props.open,
    async open => {
      if (!open) return
      void lockerRoomStore.fetchLockersInBackground()
      const lockerId = props.initialLockerId
      if (lockerId == null) return
      const locker = storeLockers.value.find(l => l.id === lockerId)
      if (locker) {
        await getLockerDetail(locker)
        emit('initial-locker-opened')
      }
    }
  )

  // Pre-selection for LockerProductsListing: when adding to collection, use selectedProducts (by id); else use selectedProductsByLocker / full locker
  const preSelectedProductsForCurrentLocker = computed(() => {
    const locker = currentLocker.value
    if (!locker?.product?.length) return []
    const creatingFromCollection =
      lockerRoomHeaderRef.value?.creatingCollection && currentCollection.value
    if (creatingFromCollection) {
      const selectedIds = new Set(selectedProducts.value.map(p => p.id))
      return locker.product.filter((p: LockerProduct) => selectedIds.has(p.id))
    }
    const ids = selectedProductsByLocker.value[locker.id] ?? []
    const isFullySelected = selectedLocker.value.includes(locker.id) && ids.length === 0
    if (isFullySelected) return [...locker.product]
    return locker.product.filter((p: LockerProduct) => ids.includes(p.id))
  })

  const handleSelectProduct = (products: LockerProduct[]) => {
    if (currentLocker.value) {
      const currentLockerProductIds = new Set(currentLocker.value.product.map(p => p.id))
      selectedProducts.value = [
        ...selectedProducts.value.filter(p => !currentLockerProductIds.has(p.id)),
        ...products
      ]
      const ids = products.map(p => p.id)
      selectedProductsByLocker.value = {
        ...selectedProductsByLocker.value,
        [currentLocker.value.id]: ids
      }
      if (ids.length > 0) {
        if (!selectedLocker.value.includes(currentLocker.value.id)) {
          selectedLocker.value = [...selectedLocker.value, currentLocker.value.id]
        }
      } else {
        selectedLocker.value = selectedLocker.value.filter(id => id !== currentLocker.value!.id)
      }
    } else {
      selectedProducts.value = products
    }
  }

  const handleToggleLocker = (lockerId: number | string) => {
    const id = Number(lockerId)
    const isSelected = selectedLocker.value.includes(lockerId)
    if (isSelected) {
      selectedLocker.value = selectedLocker.value.filter(i => i !== lockerId)
      selectedProductsByLocker.value = { ...selectedProductsByLocker.value, [id]: [] }
    } else {
      selectedLocker.value = [...selectedLocker.value, lockerId]
    }
  }

  const handleSelectLocker = (lockerIds: (string | number)[]) => {
    selectedLocker.value = lockerIds
  }
  const getCollectionDetail = async (collection: Collection) => {
    currentCollection.value = !collection.details_fetched
      ? ((await lockerRoomStore.fetchCollectionProducts(collection.id)) ?? null)
      : collection
    collectionTab.value = 'products'
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
  const handleCreateCollectionClick = () => {
    const aggregated = aggregateSelectedProductsFromStore()
    if (aggregated.length > 0) {
      selectedProducts.value = aggregated
      createCollection()
    } else {
      if (lockerRoomHeaderRef.value) {
        ;(lockerRoomHeaderRef.value as any).creatingCollection = true
      }
      tab.value = 'lockers'
      currentMode.value = 'list'
      currentCollection.value = null
      collectionCreationStep.value = 1
    }
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
    collectionTab.value = 'products'
    // If we're adding products to existing collection, keep currentCollection
    // Otherwise, clear it for new collection creation
    if (!currentCollection.value) {
      // This is a new collection, so we'll create it
      currentCollection.value = null
      workingCollectionProducts.value = selectedProducts.value.map((product, index) => ({
        id: product.id,
        allow_description: true,
        allow_price: true,
        allow_title: true,
        product_nickname: product.product_name ?? product.name ?? '',
        description: product.description ?? '',
        product_note: product.description ?? '',
        product_price: '',
        product_locker_room_id: product.id,
        product_urls: {
          front_url: product.product_front_url ?? '',
          back_url: product.product_back_url ?? ''
        },
        order_number: index + 1,
        collection_id: 0,
        created_at: '',
        updated_at: '',
        logos: [],
        ecommerce_product_id: null,
        ecommerce_variant_id: null
      })) as CollectionProduct[]
    } else {
      // Adding products to existing collection: selection is the source of truth (replace list so removals are reflected)
      const asCollectionProducts = selectedProducts.value.map((product, index) => ({
        allow_description: true,
        allow_price: true,
        allow_title: true,
        product_nickname: product.product_name ?? product.name,
        description: product.description ?? '',
        product_note: product.description ?? '',
        product_price: '',
        product_locker_room_id: product.id,
        product_urls: {
          front_url: product.product_front_url ?? '',
          back_url: product.product_back_url ?? ''
        },
        order_number: index + 1
      })) as CollectionProduct[]
      currentCollection.value = {
        ...currentCollection.value,
        collection_products: asCollectionProducts
      }
    }
  }

  const collectionProducts = computed(() => {
    if (currentCollection.value) {
      return currentCollection.value.collection_products
    }
    return workingCollectionProducts.value
  })

  const handleSaveCollection = async () => {
    if (!lockerRoomHeaderRef.value) return
    const header = lockerRoomHeaderRef.value as { collection_name?: { value?: string } | string }
    const nameVal =
      header?.collection_name &&
      typeof header.collection_name === 'object' &&
      'value' in header.collection_name
        ? header.collection_name.value
        : (header?.collection_name ?? '')
    const collectionNameRaw = String(nameVal ?? '').trim()
    if (!collectionNameRaw) {
      toast.error(msg_collection_name_required({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
      return
    }
    isSavingCollection.value = true
    try {
      const collectionDetailRef = lockerDetailsRef.value as InstanceType<
        typeof CollectionDetail
      > | null
      const previewBodyRef = collectionDetailRef?.previewBodyRef

      const baseStorageUrl = import.meta.env.VITE_APP_STORAGE_URL || ''
      const collectionName = collectionNameRaw
      const isEditing = !!currentCollection.value
      const collectionId = currentCollection.value?.id

      // Get logos: prefer CollectionDetail.workingLogos (still populated when Preview tab is unmounted).
      // Save previously read only previewBodyRef; that ref is null on the Products tab because
      // CollectionPreviewBody is not rendered, so new collections incorrectly failed logo validation.
      let logos: Array<{
        file: File | null
        url: string | null
        logo: CustomLogo | null
        id?: number
        isDeleted?: boolean
      }> = []

      const workingFromDetail = collectionDetailRef?.workingLogos
        ? unref(collectionDetailRef.workingLogos)
        : null
      if (Array.isArray(workingFromDetail)) {
        logos = workingFromDetail as typeof logos
      } else if (previewBodyRef) {
        const logosComputed = (previewBodyRef as { logos?: unknown })?.logos
        if (logosComputed) {
          if (
            typeof logosComputed === 'object' &&
            logosComputed !== null &&
            'value' in logosComputed
          ) {
            const computedValue = (logosComputed as { value: unknown }).value
            logos = Array.isArray(computedValue) ? (computedValue as typeof logos) : []
          } else if (Array.isArray(logosComputed)) {
            logos = logosComputed as typeof logos
          }
        }
      }
      if (!logos.length && isEditing && currentCollection.value?.logos) {
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
          toast.error(msg_upload_logo_before_collection({}, { locale: locale.value }), {
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
        const logoFilesData: Array<{ name: string; type: string; size?: number }> =
          logosToUpload.map((logo: any) => ({
            name: logo.file.name,
            type: logo.file.type || 'image/png',
            size: logo.file.size
          }))

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
        // When we came from "Add products" flow, selectedProducts is the full list (adds + removes already applied)
        if (addedProductsFlowFromCollection.value) {
          productsData = selectedProducts.value.map((p, index) => ({
            product_nickname: p.name ?? p.product_name,
            product_note: p.description ?? '',
            product_price: '',
            order_number: index + 1,
            product_locker_room_id: p.id,
            allow_description: true,
            allow_price: true,
            allow_title: true
          }))
          addedProductsFlowFromCollection.value = false
        } else {
          // When editing normally, merge existing collection products with newly selected ones
          if (!currentCollection.value?.details_fetched) {
            await lockerRoomStore.fetchCollectionProducts(collectionId)
            const updated = lockerRoomStore.collections.find(c => c.id === collectionId)
            if (updated) currentCollection.value = updated
          }

          const existingProducts = (currentCollection.value?.collection_products || []).map(
            (p, index) => ({
              id: p.id,
              product_nickname: p.product_nickname,
              product_note: p.product_note,
              product_price: p.product_price,
              order_number: index + 1,
              product_locker_room_id: p.product_locker_room_id,
              allow_description: p.allow_description,
              allow_price: p.allow_price,
              allow_title: p.allow_title
            })
          )

          const newProducts = selectedProducts.value.map((p, index) => ({
            product_nickname: p.name,
            product_note: p.description,
            product_price: '',
            order_number: existingProducts.length + index + 1,
            product_locker_room_id: p.id,
            allow_description: true,
            allow_price: true,
            allow_title: true
          }))

          productsData = [...existingProducts, ...newProducts]
        }
      } else {
        // Creating new collection - use working collection products (user-edited price, description, allow_*)
        productsData = workingCollectionProducts.value.map((p, index) => ({
          product_nickname: p.product_nickname,
          product_note: p.product_note ?? '',
          product_price: p.product_price ?? '',
          order_number: index + 1,
          product_locker_room_id: p.product_locker_room_id,
          allow_description: p.allow_description ?? true,
          allow_price: p.allow_price ?? true,
          allow_title: p.allow_title ?? true
        }))
      }

      // Get deleted logo IDs and prepare logo data
      const deletedLogoIds: number[] = []
      const logoData: Array<{ name: string; path: string; id?: number; is_recent_logo: boolean }> =
        []

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

          let isRecentLogo = true
          if (logo.file) {
            isRecentLogo = false
          }

          if (logoPath) {
            const logoEntry: { name: string; path: string; id?: number; is_recent_logo: boolean } =
              {
                name: `logo-${index + 1}`,
                path: logoPath,
                is_recent_logo: isRecentLogo
              }
            // Include logo ID only when editing a collection and logo has ID
            if (isEditing && collectionId && logo.id) {
              logoEntry.id = logo.id
              logoEntry.is_recent_logo = true
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
        const updated = await lockerRoomStore.updateCollection(collectionId, formData)
        if (!updated) return
        await lockerRoomStore.fetchCollections()
        if (productsData.length > 0) {
          toastCollectionSavePartialOnly(updated)
        }
        currentMode.value = 'list'
        currentCollection.value = null
        isCreatingCollection.value = false
        lockerRoomHeaderRef.value!.creatingCollection = false
        selectedLocker.value = []
        selectedProductsByLocker.value = {}
        selectedProducts.value = []
      } else {
        const saved = await lockerRoomStore.saveCollection(formData)
        if (!saved) return
        toastCollectionSavePartialOnly(saved)
        // Clear selection when collection is created (footer and context)
        selectedLocker.value = []
        selectedProductsByLocker.value = {}
        selectedProducts.value = []
        const collectionName = lockerRoomHeaderRef.value?.collection_name || 'New Collection'
        if (lockerRoomHeaderRef.value) {
          ;(lockerRoomHeaderRef.value as any).creatingCollection = false
          ;(lockerRoomHeaderRef.value as any).collection_name = ''
        }
        // Navigate to the new collection so user can add more products
        const newCollection = lockerRoomStore.collections.find(c => c.name === collectionName)
        if (newCollection) {
          await getCollectionDetail(newCollection)
          handleBackNavigation()
        } else {
          handleBackNavigation()
        }
      }
    } finally {
      isSavingCollection.value = false
    }
  }
  const handleCancelCollectionEdit = async () => {
    lockerRoomHeaderRef.value?.cancelEditCollection()
    editingCollectionName.value = false
    const collectionId = currentCollection.value?.id
    if (collectionId != null) {
      const fresh = await lockerRoomStore.fetchCollectionProducts(collectionId)
      if (fresh) {
        currentCollection.value = fresh
      }
    }
  }

  const handleConfirmCollectionEdit = async () => {
    const headerRef = lockerRoomHeaderRef.value as any
    const collection = currentCollection.value
    if (!collection?.id) return
    const nameVal = headerRef?.collection_name?.value ?? headerRef?.collection_name ?? ''
    const collectionName = String(nameVal).trim()
    if (!collectionName) {
      toast.error(msg_collection_name_required({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
      return
    }
    const logoData = (collection.logos || []).map(
      (logo: { name: string; path: string; id?: number }) => ({
        name: logo.name,
        path: logo.path,
        ...(logo.id && { id: logo.id })
      })
    )
    const productsData = (collection.collection_products || []).map((p: any, index: number) => ({
      id: p.id,
      product_nickname: p.product_nickname,
      product_note: p.product_note,
      product_price: p.product_price,
      order_number: index + 1,
      product_locker_room_id: p.product_locker_room_id,
      allow_description: p.allow_description,
      allow_price: p.allow_price,
      allow_title: p.allow_title
    }))
    const formData = new FormData()
    formData.append('name', collectionName)
    formData.append('link', collection.link || '')
    formData.append('collection_logos_data', JSON.stringify(logoData))
    formData.append('deleted_logos_ids', JSON.stringify([]))
    productsData.forEach((product: any) => {
      formData.append('products[]', JSON.stringify(product))
    })
    formData.append('_method', 'PUT')
    const nameEditResult = await lockerRoomStore.updateCollection(collection.id, formData)
    if (!nameEditResult) return
    toastCollectionSavePartialOnly(nameEditResult)
    await lockerRoomStore.fetchCollectionProducts(collection.id)
    const updated = lockerRoomStore.collections.find(c => c.id === collection.id)
    if (updated) currentCollection.value = updated
    headerRef.cancelEditCollection()
    editingCollectionName.value = false
  }

  const handleRemoveProduct = (products: CollectionProduct[]) => {
    const updatedProducts = [...products]
    if (currentCollection.value) {
      currentCollection.value = {
        ...currentCollection.value,
        collection_products: updatedProducts
      }
      // Keep selectedProducts in sync when in add-products flow (e.g. user removed one on step 2)
      if (addedProductsFlowFromCollection.value) {
        const keptIds = new Set(updatedProducts.map(p => p.product_locker_room_id))
        selectedProducts.value = selectedProducts.value.filter(p => keptIds.has(p.id))
      }
    } else {
      // Create flow: sync working collection products so save uses the updated list
      workingCollectionProducts.value = updatedProducts
    }
  }

  const handleUpdateCollectionProducts = (products: CollectionProduct[]) => {
    workingCollectionProducts.value = products
  }

  const handleLogoRemoved = (_index: number, _logoId?: number) => {
    // Logo removal is handled in CollectionPreviewBody
    // The deleted logo ID will be tracked when saving
    // This handler is here to satisfy the emit requirement
  }

  const handleAddToCollection = async (targetCollection: Collection) => {
    if (!currentCollection.value) return
    isAddingToCollection.value = true
    try {
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
        product_locker_room_id: p.id
      }))

      const existingProducts = (collectionToUpdate.collection_products || []).map((p, index) => ({
        id: p.id,
        product_nickname: p.product_nickname,
        product_note: p.product_note,
        product_price: p.product_price,
        order_number: index + 1,
        product_locker_room_id: p.id
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
      const mergeResult = await lockerRoomStore.updateCollection(collectionToUpdate.id, formData)
      if (!mergeResult) return

      toastCollectionAddOrMergeMaybePartial(
        mergeResult,
        msg_products_added_to_collection({}, { locale: locale.value })
      )

      // Refresh target collection
      await lockerRoomStore.fetchCollectionProducts(targetCollection.id)
      const updatedCollection = lockerRoomStore.collections.find(c => c.id === targetCollection.id)
      if (updatedCollection) {
        currentCollection.value = updatedCollection
        getCollectionDetail(updatedCollection)
      }
    } finally {
      isAddingToCollection.value = false
    }
  }

  const handleAddProductsToCollection = () => {
    // Switch to lockers tab and enable collection creation mode; pre-select current collection products in footer and listing
    isCreatingCollection.value = true
    lockerRoomHeaderRef.value!.creatingCollection = true
    addedProductsFlowFromCollection.value = true
    tab.value = 'lockers'
    currentMode.value = 'list'
    collectionCreationStep.value = 1
    currentLocker.value = null
    const collection = currentCollection.value
    if (collection?.collection_products?.length) {
      selectedProducts.value = collection.collection_products.map(cp =>
        collectionProductToStubLockerProduct(cp)
      )
      selectedProductsByLocker.value = {}
      selectedLocker.value = []
    }
  }

  const handleSelectCollectionProducts = (products: LockerProduct[]) => {
    selectedProducts.value = products
  }

  const handleCancelCollectionCreation = () => {
    currentMode.value = 'list'
    currentLocker.value = null
    tab.value = 'collections'
    lockerTab.value = 'products'
    collectionCreationStep.value = 1
    collectionTab.value = 'products'
    selectedProducts.value = []
    selectedProductsByLocker.value = {}
    selectedLocker.value = []
    addedProductsFlowFromCollection.value = false
    if (lockerRoomHeaderRef.value) {
      ;(lockerRoomHeaderRef.value as any).creatingCollection = false
      ;(lockerRoomHeaderRef.value as any).collection_name = ''
    }
  }

  const handleUnselectAllList = () => {
    selectedLocker.value = []
    selectedProductsByLocker.value = {}
    selectedProducts.value = []
  }

  const handleUnselectAllDetail = () => {
    if (addedProductsFlowFromCollection.value) {
      selectedProducts.value = []
      selectedProductsByLocker.value = {}
      selectedLocker.value = []
    }
  }

  const handleProductsDeleted = (deletedIds: number[], lockerId: number) => {
    const idSet = new Set(deletedIds)
    const remainingIds = (selectedProductsByLocker.value[lockerId] ?? []).filter(
      id => !idSet.has(id)
    )
    selectedProductsByLocker.value = {
      ...selectedProductsByLocker.value,
      [lockerId]: remainingIds
    }
    selectedProducts.value = selectedProducts.value.filter(p => !idSet.has(p.id))
    // If this locker now has no products selected, remove it from selectedLocker so we don't treat it as "full locker selected"
    if (remainingIds.length === 0) {
      selectedLocker.value = selectedLocker.value.filter(id => Number(id) !== lockerId)
    }
    const updatedLocker = storeLockers.value.find(l => l.id === lockerId) ?? null
    if (currentLocker.value?.id === lockerId) {
      currentLocker.value = updatedLocker
    }
  }

  const handleAddToCollectionFromLocker = async (targetCollection: Collection) => {
    if (!currentLocker.value || selectedProducts.value.length === 0) return
    isAddingToCollection.value = true
    try {
      // Convert selected products to collection products format
      const productsToAdd = selectedProducts.value.map((product: LockerProduct) => ({
        allow_description: true,
        allow_price: true,
        allow_title: true,
        product_nickname: product.product_name,
        description: product.description,
        product_note: product.description,
        product_price: '',
        product_locker_room_id: product.id
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
        product_locker_room_id: p.product_locker_room_id,
        allow_description: p.allow_description,
        allow_price: p.allow_price,
        allow_title: p.allow_title
      }))

      const newProducts = productsToAdd.map((p, index) => {
        return {
          product_nickname: p.product_nickname,
          product_note: p.product_note,
          product_price: p.product_price,
          order_number: existingProducts.length + index + 1,
          product_locker_room_id: p.product_locker_room_id,
          allow_description: true,
          allow_price: true,
          allow_title: true
        } as CollectionProduct
      })
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

      const addFromLockerResult = await lockerRoomStore.updateCollection(
        collectionToUpdate.id,
        formData
      )
      if (!addFromLockerResult) return

      // Refresh collection
      await lockerRoomStore.fetchCollectionProducts(targetCollection.id)
      toastCollectionAddOrMergeMaybePartial(
        addFromLockerResult,
        msg_products_added_to_collection({}, { locale: locale.value })
      )

      // Clear selection for current locker so listing and footer stay in sync
      if (currentLocker.value) {
        const lockerId = currentLocker.value.id
        selectedProductsByLocker.value = {
          ...selectedProductsByLocker.value,
          [lockerId]: []
        }
        selectedLocker.value = selectedLocker.value.filter(id => Number(id) !== lockerId)
      }
      selectedProducts.value = []
    } finally {
      isAddingToCollection.value = false
    }
  }

  watch(
    () => props.open,
    newVal => {
      if (!newVal) {
        currentMode.value = 'list'
        tab.value = 'lockers'
        lockerTab.value = 'products'
        collectionCreationStep.value = 1
        collectionTab.value = 'products'
        sortOption.value = 'lastModified'
        search.value = ''
        selectedLocker.value = []
        selectedProductsByLocker.value = {}
        selectedProducts.value = []
        if (lockerRoomHeaderRef.value) {
          ;(lockerRoomHeaderRef.value as any).creatingCollection = false
          ;(lockerRoomHeaderRef.value as any).collection_name = ''
        }
      }
    }
  )
</script>

<template>
  <Dialog :open="open" variant="large" @update:open="emit('update:open', $event)">
    <DialogContent variant="large" class="flex min-h-0 flex-col w-full overflow-hidden">
      <div ref="lockerShellRef" class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div ref="lockerHeaderMeasureRef" class="shrink-0">
          <LockerRoomHeader
            ref="lockerRoomHeaderRef"
            v-model:search="search"
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
        @create-collection="handleCreateCollectionClick"
        @start-edit-collection-name="editingCollectionName = true"
        @end-edit-collection-name="editingCollectionName = false"
          />
        </div>
        <ScrollArea :style="lockerScrollAreaStyle" class="min-h-0 w-full min-w-0">
          <!-- NOTE: Avoid `absolute inset-0` panels here. Reka's ScrollArea measures content size
               via ResizeObserver; absolutely-positioned children don't resize the observed content
               box, causing the scrollbar thumb to get "stuck" at its initial size. -->
          <div class="w-full">
            <Transition name="slide-horizontal" mode="out-in">
              <div
                v-if="tab === 'lockers' && currentMode === 'list'"
                key="locker-list"
                class="w-full"
              >
                <LockersList
                  ref="lockerListRef"
                  :is-creating-collection="lockerRoomHeaderRef?.creatingCollection ?? false"
                  :search="search"
                  :sort="sortOption"
                  :selected-lockers="selectedLocker"
                  :selected-products-by-locker="selectedProductsByLocker"
                  @select-locker="handleSelectLocker"
                  @toggle-locker="handleToggleLocker"
                  @open-locker="getLockerDetail"
                />
              </div>

              <div
                v-else-if="tab === 'collections' && currentMode === 'list'"
                key="collections"
                class="w-full"
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
                class="w-full"
              >
                <LockerDetail
                  ref="lockerDetailsRef"
                  :key="currentLocker.id"
                  :is-creating-collection="lockerRoomHeaderRef?.creatingCollection ?? false"
                  :locker-tab="lockerTab"
                  :locker="currentLocker"
                  :sort="sortOption"
                  :search="search"
                  :pre-selected-products="preSelectedProductsForCurrentLocker"
                  @select-product="handleSelectProduct"
                  @edit-product="payload => emit('edit-product', payload)"
                />
              </div>

              <div
                v-else-if="tab === 'collections' && currentMode === 'detail'"
                key="collection-detail"
                class="w-full"
              >
                <CollectionDetail
                  ref="lockerDetailsRef"
                  :is-creating-collection="lockerRoomHeaderRef?.creatingCollection ?? false"
                  :collection-tab="collectionTab"
                  :collection="currentCollection"
                  :pre-selected-products="collectionProducts"
                  :sort="sortOption"
                  @select-product="handleSelectCollectionProducts"
                  @remove-product="handleRemoveProduct"
                  @update:collection-products="handleUpdateCollectionProducts"
                  @logo-removed="handleLogoRemoved"
                />
              </div>
            </Transition>
          </div>
        </ScrollArea>

        <div
          v-if="
          (tab === 'collections' && lockerRoomHeaderRef!.creatingCollection) ||
          lockerTab === 'products' ||
          lockerRoomHeaderRef?.creatingCollection
        "
          ref="lockerFooterMeasureRef"
          class="shrink-0"
        >
          <LockerRoomFooter
        :current-collection="currentCollection"
        :locker-products-ref="lockerDetailsRef?.lockerProductsRef"
        :current-tab="tab"
        :current-locker="currentLocker"
        :current-mode="currentMode"
        :details-tab="lockerTab"
        :selected-products="selectedProducts"
        :selected-lockers="selectedLocker"
        :selected-products-by-locker="selectedProductsByLocker"
        :is-creating-collection="lockerRoomHeaderRef?.creatingCollection ?? false"
        :collection-creation-step="collectionCreationStep"
        :is-editing-collection-name="editingCollectionName"
        :is-saving-collection="isSavingCollection"
        :is-adding-to-collection="isAddingToCollection"
        @back="handleBackNavigation"
        @cancel-collection-edit="handleCancelCollectionEdit"
        @confirm-collection-edit="handleConfirmCollectionEdit"
        @close="emit('update:open', false)"
        @cancel-collection-creation="handleCancelCollectionCreation"
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
        @unselect-all-list="handleUnselectAllList"
        @unselect-all-detail="handleUnselectAllDetail"
        @clear-selection="handleUnselectAllList"
        @products-deleted="handleProductsDeleted"
          />
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
