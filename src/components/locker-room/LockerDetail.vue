<script setup lang="ts">
  import type { Locker, LockerProduct, ProductRosterDetail } from '@/services/lockers/types'
  import { computed, ref, type ComputedRef } from 'vue'
  import LockerAssetsListing from './LockerAssetsListing.vue'
  import LockerColoursListing from './LockerColoursListing.vue'
  import LockerProductsListing from './LockerProductsListing.vue'
  import LockerRosters from './LockerRosters.vue'
  type LockerTab = 'products' | 'assets' | 'colours' | 'rosters'
  type RosterProps = {
    roster_group: ProductRosterDetail[] | undefined
    group_name: string
  }
  const props = defineProps<{
    locker: Locker
    lockerTab: LockerTab
    preSelectedProducts: LockerProduct[]
    isCreatingCollection: boolean
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
      roster_group: prod.product_roster_detail,
      group_name: prod.product_name
    }))
  )
  defineExpose({ lockerProductsRef })
</script>

<template>
  <Transition name="slide-horizontal" mode="out-in">
    <div v-if="activeTab === 'products'" key="products" class="absolute inset-0">
      <LockerProductsListing
        ref="lockerProductsRef"
        :products="locker.product"
        :locker-id="locker.id"
        :pre-selected-products="preSelectedProducts"
        :is-creating-collection="isCreatingCollection"
        @select-product="
          (locker_products: LockerProduct[]) => emit('select-product', locker_products)
        "
        @edit-product="payload => emit('edit-product', payload)"
      />
    </div>

    <div v-else-if="activeTab === 'assets'" key="assets" class="absolute inset-0">
      <LockerAssetsListing :locker="locker" />
    </div>

    <div v-else-if="activeTab === 'colours'" key="colours" class="absolute inset-0">
      <LockerColoursListing :locker="locker" />
    </div>
    <div v-else-if="activeTab === 'rosters'" key="rosters" class="absolute inset-0">
      <LockerRosters :rosters="rosters_groups" />
    </div>
  </Transition>
</template>
