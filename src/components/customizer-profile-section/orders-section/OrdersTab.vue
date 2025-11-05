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
  import { Filter, Search, X } from 'lucide-vue-next'
  import InfiniteScroll from '@/components/ui/infinite-scroll/InfiniteScroll.vue'
  import Loader from '@/components/ui/loader/Loader.vue'
  import OrdersListItem from './OrdersListItem.vue'
  import type { Order } from '@/services/orders/types'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { getOrderOptions } from '@/helpers/orderStatuses'
  import WorkflowBreadcrumbs from '@/components/customization-workflow/WorkflowBreadcrumbs.vue'
  import OrderDetailsView from './OrderDetailsView.vue'
  import OrderTimeline from './OrderTimeline.vue'

  const store = useProfileStore()

  // ✅ Dynamically computed filter options
  const orderStatuses = computed(() => getOrderOptions(store.ordersPageType))

  onMounted(() => {
    // Load persisted state
    store.loadFromLocalStorage()

    // If on timeline view and activeOrder exists, fetch fresh details
    if (store.activeOrder?.id && store.activeOrderView === 'timeline') {
      store.fetchOrderDetails(store.activeOrder.id)
    }

    // Fetch orders if none loaded
    if (!store.orders.length) {
      const query = new URLSearchParams()
      const { search, filter } = store.ordersParams
      if (search) query.set('search', search)
      if (filter) query.set('filter', filter)
      const params = query.toString() ? `?${query.toString()}` : ''
      store.fetchOrders(params)
    }
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
  const breadcrumbs = computed(() => store.breadcrumbs)

  function showOrderDetails(order: Order) {
    // Open details without extra API call
    store.openOrderDetails(order)
  }
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="sticky top-0 z-10 pb-3 w-max px-4">
      <WorkflowBreadcrumbs :breadcrumbs="breadcrumbs" />
    </div>
    <!-- Filter -->
    <div
      v-if="!store.activeOrder"
      class="flex items-center justify-between gap-2 border-b pb-2 px-4"
    >
      <div class="relative w-full">
        <Input
          v-model="store.ordersParams.search"
          placeholder="Search orders"
          class="h-8 w-full pl-8 pr-8"
          @keydown="onSearchEnter"
        />
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
        <button
          v-if="store.ordersParams.search"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          @click="store.clearSearch()"
        >
          <X class="size-4" />
        </button>
      </div>
      <div class="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              size="sm"
              variant="outline"
              class="px-2 h-8 shadow-none"
              :class="
                store.ordersParams.filter
                  ? 'bg-primary text-white border-primary'
                  : 'border-[#E5E5E5]'
              "
            >
              <Filter class="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="store.clearFilter()">Clear Filter</DropdownMenuItem>
            <DropdownMenuSeparator />
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
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          v-if="store.ordersParams.filter"
          size="sm"
          variant="ghost"
          class="h-8 px-2 text-primary"
          @click="store.clearFilter()"
        >
          Clear filter
        </Button>
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
    <div v-if="!store.activeOrder" class="flex-1 overflow-auto">
      <InfiniteScroll @load-more="loadMore">
        <div v-if="store.orders.length">
          <OrdersListItem
            v-for="order in store.orders"
            :key="order.id"
            :order="order"
            :expanded="store.ordersView === 'expanded-list'"
            @cancel="store.cancelOrder"
            @pdf="() => {}"
            @details="() => showOrderDetails(order)"
          />
        </div>
        <div v-else class="flex justify-center py-10 text-gray-500">No orders found</div>

        <div v-if="store.isLoadingOrders" class="flex justify-center py-6">
          <Loader />
        </div>
      </InfiniteScroll>
    </div>
    <div v-else class="flex-1 overflow-auto">
      <OrderDetailsView
        v-if="store.activeOrderView === 'details'"
        :order="store.activeOrder"
        @back="store.closeOrderDetails"
      />
      <OrderTimeline v-else :order="store.activeOrder" />
    </div>
  </div>
</template>
