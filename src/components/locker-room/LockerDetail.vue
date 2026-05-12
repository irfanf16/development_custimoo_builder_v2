<script setup lang="ts">
  import type { Locker, LockerProduct } from '@/services/lockers/types'
  import type { ProductRosterDetail } from '@/services/products/types'
  import { computed, ref, type ComputedRef } from 'vue'
  import { stripCsvExtension } from '@/lib/utils'
  import LockerAssetsListing from './LockerAssetsListing.vue'
  import LockerColoursListing from './LockerColoursListing.vue'
  import LockerProductsListing from './LockerProductsListing.vue'
  import LockerRosters from './LockerRosters.vue'
  type LockerTab = 'products' | 'assets' | 'colours' | 'rosters'
  type SortOption = 'lastModified' | 'alphabetical' | 'createdDate'
  type RosterProps = {
    roster_group: ProductRosterDetail[] | undefined
    group_name: string
  }
  const props = defineProps<{
    locker: Locker
    lockerTab: LockerTab
    preSelectedProducts: LockerProduct[]
    isCreatingCollection: boolean
    sort: SortOption
    search: string | null
  }>()
  const activeTab = computed(() => props.lockerTab)
  type EditLockerProductPayload = {
    lockerProductId: number
    lockerId: number
    lockerProduct: LockerProduct
  }
  const emit = defineEmits<{
    (e: 'select-product', products: LockerProduct[]): void
    (e: 'edit-product', payload: EditLockerProductPayload): void
  }>()
  const lockerProductsRef = ref<InstanceType<typeof LockerProductsListing> | null>(null)

  const rosters_groups: ComputedRef<RosterProps[]> = computed(() =>
    props.locker.product.map(prod => ({
      roster_group: prod.product_roster_detail ?? undefined,
      group_name: stripCsvExtension(prod.product_name || '')
    }))
  )
  defineExpose({ lockerProductsRef })
</script>

<template>
  <!-- Keep tab panels in normal flow so parent ScrollArea can measure content height and
       adjust scrollbar thumb size correctly. -->
  <Transition name="slide-horizontal" mode="out-in">
    <div v-if="activeTab === 'products'" data-testid="locker-room-locker-detail-products" key="products" class="w-full">
      <LockerProductsListing
        ref="lockerProductsRef"
        :products="locker.product"
        :locker-id="locker.id"
        :pre-selected-products="preSelectedProducts"
        :is-creating-collection="isCreatingCollection"
        :sort="sort"
        :search="search"
        @select-product="
          (locker_products: LockerProduct[]) => emit('select-product', locker_products)
        "
        @edit-product="payload => emit('edit-product', payload)"
      />
    </div>

    <div v-else-if="activeTab === 'assets'" key="assets" class="w-full">
      <LockerAssetsListing :locker="locker" />
    </div>

    <div v-else-if="activeTab === 'colours'" key="colours" class="w-full">
      <LockerColoursListing :locker="locker" />
    </div>
    <div v-else-if="activeTab === 'rosters'" key="rosters" class="w-full">
      <LockerRosters :rosters="rosters_groups" />
    </div>
  </Transition>
</template>
