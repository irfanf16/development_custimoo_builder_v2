<script setup lang="ts">
  import LockerDetail from '@/components/locker-room/LockerDetail.vue'
  import LockersList from '@/components/locker-room/LockersList.vue'
  import { Dialog, DialogContent } from '@/components/ui/dialog'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import type {
    Collection,
    CollectionProduct,
    Locker,
    LockerProduct,
    ProductLockerRoom
  } from '@/services/lockers/types'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { ref, watch } from 'vue'
  import LockerRoomFooter from './locker-room/LockerRoomFooter.vue'
  import LockerRoomHeader from './locker-room/LockerRoomHeader.vue'
  import CollectionList from './locker-room/CollectionList.vue'
  import CollectionDetail from './locker-room/CollectionDetail.vue'
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
  const isCreatingCollection = ref<boolean>(false)
  const collectionCreationStep = ref<number>(1)
  const collectionProducts = ref<CollectionProduct[]>([])
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
      ? ((await lockerRoomStore.fetchCollectionProducts(collection.id)) ?? null)
      : collection
    collectionProducts.value = currentCollection.value?.collection_products ?? []
    currentMode.value = 'detail'
    tab.value = 'collections'
    collectionCreationStep.value = 2
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
    currentMode.value = 'detail'
    tab.value = 'collections'
    collectionCreationStep.value = 2
  }
  const handleProductSelect = (products: LockerProduct[]) => {
    selectedProducts.value = products
    collectionProducts.value = selectedProducts.value.map(product => {
      return {
        allow_description: true,
        allow_price: true,
        allow_title: true,
        product_nickname: product.product_name,
        description: product.description,
        product_note: product.description,
        product_price: '',
        product_locker_room_id: product.id,
        product_locker_room: {
          front_url: product.product_front_url,
          product_id: product.id
        } as ProductLockerRoom
      } as CollectionProduct
    })
  }

  const handleSaveCollection = async () => {
    if (lockerRoomHeaderRef.value) {
      if (lockerRoomHeaderRef.value.collection_name) {
        const prods = collectionProducts.value.map((product, index) => {
          return {
            allow_description: true,
            allow_price: true,
            allow_title: true,
            product_nickname: product.product_nickname,
            product_note: product.product_note ?? '',
            product_price: product.product_price,
            product_locker_room_id: product.product_locker_room_id,
            order_number: index + 1
          } as CollectionProduct
        })

        const formData = new FormData()

        formData.append('name', lockerRoomHeaderRef.value.collection_name)
        formData.append('link', '')
        formData.append('collection_logos_data', JSON.stringify([]))
        formData.append('deleted_logos_ids', JSON.stringify([]))

        prods.forEach(prod => {
          formData.append('products[]', JSON.stringify(prod))
        })
        try {
          await lockerRoomStore.saveCollection(formData)
          currentMode.value = 'list'
          currentLocker.value = null
          lockerTab.value = 'products'
          collectionTab.value = 'products'
          tab.value = 'collections'
          currentCollection.value = null
          collectionCreationStep.value = 1
          lockerRoomHeaderRef.value.creatingCollection = false
          selectedProducts.value = []
          collectionProducts.value = []
        } catch (err) {
          toast.error(err as string, { richColors: true })
        }
      } else {
        toast.info('Collection Name is required', {
          richColors: true,
          duration: 5000
        })
      }
    }
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
        @create-collection="
          () => {
            lockerRoomHeaderRef!.creatingCollection = true
            tab = 'lockers'
            currentMode = 'list'
            currentCollection = null
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
                :pre-selected-products="selectedProducts"
                @select-product="handleProductSelect"
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
        :lockers-list-ref="lockerListRef"
        :details-tab="lockerTab"
        :selected-products="selectedProducts"
        :selected-lockers="selectedLocker"
        :is-creating-collection="lockerRoomHeaderRef?.creatingCollection ?? false"
        :collection-creation-step="collectionCreationStep"
        @back="handleBackNavigation"
        @save-collection="handleSaveCollection"
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
      />
    </DialogContent>
  </Dialog>
</template>
