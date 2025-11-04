<script setup lang="ts">
  import { onMounted, computed } from 'vue'
  import { Input } from '@/components/ui/input'
  import { Button } from '@/components/ui/button'
  import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator
  } from '@/components/ui/dropdown-menu'
  import { Filter } from 'lucide-vue-next'
  import InfiniteScroll from '@/components/ui/infinite-scroll/InfiniteScroll.vue'
  import Loader from '@/components/ui/loader/Loader.vue'
  import OrdersListItem from './OrdersListItem.vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { getOrderOptions } from '@/helpers/orderStatuses'

  const store = useProfileStore()

  // ✅ Dynamically computed filter options
  const orderStatuses = computed(() => getOrderOptions(store.ordersPageType))

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
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="sticky top-0 z-10 pb-3 w-max px-4">
      <div class="text-lg font-semibold w-max">Orders</div>
    </div>
    <!-- Filter -->
    <div class="flex items-center justify-between gap-2 border-b pb-2 px-4">
      <Input
        v-model="store.ordersParams.search"
        placeholder="Search orders"
        class="h-8 w-full"
        @keydown="onSearchEnter"
      />
      <div class="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              size="sm"
              variant="outline"
              class="px-2 h-8 shadow-none"
              :class="
                store.ordersParams.filter ? 'border-primary text-primary' : 'border-[#E5E5E5]'
              "
            >
              <Filter class="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              v-for="status in orderStatuses"
              :key="status.value"
              :class="{ 'bg-accent': status.value === store.ordersParams.filter }"
              @click="
                () => {
                  store.ordersParams.filter = status.value
                  store.filterOrders()
                }
              "
            >
              {{ status.text }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="store.clearFilter()">Clear Filter</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <!-- View Toggle -->
        <div class="flex border border-[#E5E5E5] rounded-[8px] overflow-hidden">
          <!-- List Button -->
          <Button
            size="sm"
            variant="ghost"
            class="flex-1 rounded-none px-2 h-8"
            :class="[
              store.ordersView === 'list'
                ? 'bg-primary text-white rounded-l-[8px]'
                : 'bg-transparent text-gray-600'
            ]"
            @click="store.setView('list')"
          >
            <i-flex-line-list-view class="size-5" />
          </Button>

          <!-- Expanded Button -->
          <Button
            size="sm"
            variant="ghost"
            class="flex-1 rounded-none border-l border-[#E5E5E5] px-2 h-8"
            :class="[
              store.ordersView === 'expanded-list'
                ? 'bg-primary text-white rounded-r-[8px]'
                : 'bg-transparent text-gray-600'
            ]"
            @click="store.setView('expanded-list')"
          >
            <i-flex-line-grid-view class="size-5" />
          </Button>
        </div>
      </div>
    </div>
    <!-- Orders List -->
    <div class="flex-1 overflow-auto">
      <InfiniteScroll @load-more="loadMore">
        <div v-if="store.orders.length">
          <OrdersListItem
            v-for="order in store.orders"
            :key="order.id"
            :order="order"
            :expanded="store.ordersView === 'expanded-list'"
            @cancel="store.cancelOrder"
            @pdf="() => {}"
            @details="() => {}"
          />
        </div>
        <div v-else class="flex justify-center py-10 text-gray-500">No orders found</div>

        <div v-if="store.isLoadingOrders" class="flex justify-center py-6">
          <Loader />
        </div>
      </InfiniteScroll>
    </div>
  </div>
</template>
