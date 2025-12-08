<script setup lang="ts">
  import LockerDetail from '@/components/locker-room/LockerDetail.vue'
  import LockersList from '@/components/locker-room/LockersList.vue'
  import { Dialog, DialogContent } from '@/components/ui/dialog'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import type { Locker, LockerProduct } from '@/services/lockers/types'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { ref, watch } from 'vue'
  import LockerRoomFooter from './locker-room/LockerRoomFooter.vue'
  import LockerRoomHeader from './locker-room/LockerRoomHeader.vue'

  type SortOption = 'lastModified' | 'alphabetical' | 'createdDate'
  type LockerTab = 'products' | 'assets' | 'colours' | 'rosters'

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
  const sortOption = ref<SortOption>('lastModified')
  const search = ref('')
  const selectedLocker = ref<(string | number)[]>([])
  const selectedProducts = ref<LockerProduct[]>([])
  const currentLocker = ref<Locker | null>(null)
  const lockerListRef = ref()
  const lockerDetailsRef = ref<InstanceType<typeof LockerDetail> | null>(null)

  const setSort = (value: SortOption) => {
    sortOption.value = value
  }
  const handleBackNavigation = () => {
    currentMode.value = 'list'
    currentLocker.value = null
    lockerTab.value = 'products'
    selectedProducts.value = []
  }
  const getLockerDetail = async (locker: Locker) => {
    currentLocker.value = !locker.details_fetched
      ? ((await lockerRoomStore.fetchLockerProducts(locker.id)) ?? null)
      : locker
    currentMode.value = 'detail'
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
    <DialogContent variant="large" class="h-full flex flex-col w-full">
      <LockerRoomHeader
        :current-mode="currentMode"
        :sort-option="sortOption"
        :current-locker="currentLocker"
        :main-tab="tab"
        :locker-detail-tab="lockerTab"
        @change-current-locker="getLockerDetail"
        @sort="setSort"
        @search="(val: string) => (search = val)"
        @tab-change="(val: 'lockers' | 'collections') => (tab = val)"
        @back="handleBackNavigation"
        @change-locker-tab="(val: LockerTab) => (lockerTab = val)"
        @create-locker="createLocker"
        @update-locker="updateLocker"
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
                :search="search"
                @select-locker="selectedLocker = $event"
                @open-locker="getLockerDetail"
              />
            </div>

            <div
              v-else-if="tab === 'lockers' && currentMode === 'detail' && currentLocker"
              key="locker-detail"
              class="absolute inset-0"
            >
              <LockerDetail
                ref="lockerDetailsRef"
                :locker-tab="lockerTab"
                :locker="currentLocker"
                @select-product="
                  (locker_products: LockerProduct[]) => (selectedProducts = locker_products)
                "
              />
            </div>

            <div v-else-if="tab === 'collections'" key="collections" class="absolute inset-0">
              Test
            </div>
          </Transition>
        </div>
      </ScrollArea>

      <LockerRoomFooter
        v-if="lockerTab === 'products'"
        :locker-products-ref="lockerDetailsRef?.lockerProductsRef"
        :current-tab="tab"
        :current-locker="currentLocker"
        :current-mode="currentMode"
        :lockers-list-ref="lockerListRef"
        :details-tab="lockerTab"
        :selected-products="selectedProducts"
        :selected-lockers="selectedLocker"
        @back="handleBackNavigation"
      />
    </DialogContent>
  </Dialog>
</template>
