<script setup lang="ts">
  import { onMounted } from 'vue'
  import { Input } from '@/components/ui/input'
  import { Button } from '@/components/ui/button'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import OrdersListItem from './OrdersListItem.vue'
  import InfiniteScroll from '@/components/ui/infinite-scroll/InfiniteScroll.vue'
  import Loader from '@/components/ui/loader/Loader.vue'

  const store = useProfileStore()

  onMounted(() => {
    if (!store.orders.length) store.fetchOrders()
  })

  function onSearchEnter(e: KeyboardEvent) {
    if (e.key === 'Enter') store.filterOrders()
  }

  async function loadMore() {
    const nextPage = store.pagination.currentPage + 1
    const totalPages = Math.ceil(store.pagination.total / store.pagination.perPage)
    if (nextPage <= totalPages && !store.isLoading) {
      await store.handlePagination(nextPage)
    }
  }
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="sticky top-0 z-10 pb-3 bg-white">
      <div class="flex flex-col gap-2">
        <div class="text-lg font-semibold">Orders</div>
        <div class="flex items-center justify-between gap-2">
          <Input
            v-model="store.ordersParams.search"
            placeholder="Search orders"
            class="h-8 w-[220px]"
            @keydown="onSearchEnter"
          />
          <div class="flex items-center gap-2">
            <Button size="sm" variant="outline" @click="store.filterOrders()">Filter</Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Orders List with Infinite Scroll -->
    <InfiniteScroll @load-more="loadMore">
      <div v-if="store.orders.length">
        <OrdersListItem
          v-for="order in store.orders"
          :key="order.id"
          :order="order"
          @cancel="store.cancelOrder"
          @pdf="() => {}"
          @details="() => {}"
        />
      </div>

      <div v-else class="flex justify-center py-10 text-gray-500">No orders found</div>

      <div v-if="store.isLoading" class="flex justify-center py-6">
        <Loader />
      </div>
    </InfiniteScroll>
  </div>
</template>
