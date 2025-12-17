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
  import { Check, Filter, Search, X } from 'lucide-vue-next'
  import InfiniteScroll from '@/components/ui/infinite-scroll/InfiniteScroll.vue'
  import Spinner from '@/components/ui/spinner/Spinner.vue'
  import OrdersListItem from './OrdersListItem.vue'
  import type { Order } from '@/services/orders/types'
  import { getOrderOptions } from '@/helpers/orderStatuses'
  import WorkflowBreadcrumbs from '@/components/customization-workflow/WorkflowBreadcrumbs.vue'
  import OrderDetailsView from './OrderDetailsView.vue'
  import OrderTimeline from '@/components/customizer-profile-section/orders-section/order-timeline/OrderTimeline.vue'
  import { useOrdersStore } from '@/stores/orders/orders.store'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { m as messages } from '@/paraglide/messages'

  const store = useOrdersStore()
  const profileStore = useProfileStore()
  const uiStore = useUIStore()
  const isMobile = uiStore.isMobile

  const t = computed(() => ({
    searchOrders: messages.profile_search_orders({}, { locale: profileStore.currentLocale }),
    filter: messages.profile_filter({}, { locale: profileStore.currentLocale }),
    clearFilter: messages.profile_clear_filter({}, { locale: profileStore.currentLocale }),
    clearFilterButton: messages.profile_clear_filter_button(
      {},
      { locale: profileStore.currentLocale }
    ),
    noOrdersFound: messages.profile_no_orders_found({}, { locale: profileStore.currentLocale }),
    loadingMoreOrders: messages.profile_loading_more_orders(
      {},
      { locale: profileStore.currentLocale }
    )
  }))

  // ✅ Dynamically computed filter options
  const orderStatuses = computed(() => getOrderOptions(store.ordersPageType))

  onMounted(() => {
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
    if (nextPage <= totalPages && !store.isLoadingOrders) {
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
          :placeholder="t.searchOrders"
          class="h-8 w-full pl-8 pr-8"
          @keydown="onSearchEnter"
        />
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-foreground" />
        <button
          v-if="store.ordersParams.search"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-foreground"
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
                store.ordersParams.filter ? 'bg-primary text-foreground border-primary' : 'border'
              "
            >
              <Filter class="size-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            :position-strategy="'absolute'"
            :collision-padding="32"
            class="rounded-lg shadow-md border p-0 mt-1 h-auto max-h-80 overflow-auto"
          >
            <!-- Header -->
            <div class="px-3 py-2.5 font-semibold text-sm">{{ t.filter }}</div>

            <!-- Clear Filter -->
            <DropdownMenuItem
              class="rounded-none px-3 py-2.5 text-sm justify-start gap-2"
              @click="store.clearFilter()"
            >
              <span class="w-4"></span>
              {{ t.clearFilter }}
            </DropdownMenuItem>

            <DropdownMenuSeparator class="mx-0 my-0 bg-border" />

            <!-- Status Filters -->
            <DropdownMenuItem
              v-for="status in orderStatuses"
              :key="status.value"
              class="rounded-none px-3 py-2.5 text-sm justify-start gap-2"
              :class="
                status.value === store.ordersParams.filter
                  ? 'bg-transparent text-foreground'
                  : 'hover:bg-transparent'
              "
              @click="
                () => {
                  store.ordersParams.filter = status.value
                  store.filterOrders()
                }
              "
            >
              <!-- Tick on left, space reserved -->
              <Check
                v-if="status.value === store.ordersParams.filter"
                class="size-4 text-foreground"
              />
              <span v-else class="w-4"></span>
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
          {{ t.clearFilterButton }}
        </Button>
        <!-- View Toggle -->
        <div class="flex border rounded-[8px] overflow-hidden">
          <!-- List Button -->
          <Button
            size="sm"
            variant="ghost"
            class="flex-1 rounded-none px-2 h-8"
            :class="[
              store.ordersView === 'list'
                ? 'bg-primary text-primary-foreground rounded-l-[8px]'
                : 'bg-transparent text-foreground'
            ]"
            @click="store.setView('list')"
          >
            <i-flex-line-list-view class="size-5" />
          </Button>

          <!-- Expanded Button -->
          <Button
            size="sm"
            variant="ghost"
            class="flex-1 rounded-none border-l px-2 h-8"
            :class="[
              store.ordersView === 'expanded-list'
                ? 'bg-primary text-primary-foreground rounded-r-[8px]'
                : 'bg-transparent text-foreground'
            ]"
            @click="store.setView('expanded-list')"
          >
            <i-flex-line-grid-view class="size-5" />
          </Button>
        </div>
      </div>
    </div>
    <!-- Orders List -->
    <ScrollArea v-if="!store.activeOrder" class="flex-1 overflow-y-auto">
      <InfiniteScroll :class="'w-full h-full relative'" @load-more="loadMore">
        <div v-if="store.orders.length" class="absolute inset-0">
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
        <div v-else class="flex justify-center py-10 text-foreground">{{ t.noOrdersFound }}</div>

        <div v-if="store.isLoadingOrders" class="flex justify-center py-6">
          <Spinner class="text-primary size-6" />
        </div>
        <!-- Smooth bottom loader when fetching more -->
        <div
          v-if="store.isLoadingMore && store.orders.length"
          class="flex justify-center py-4 text-forground transition-all duration-300"
        >
          <Spinner class="text-primary size-4" />
          <span class="ml-2 text-sm">{{ t.loadingMoreOrders }}</span>
        </div>
      </InfiniteScroll>
    </ScrollArea>
    <component
      :is="isMobile ? 'div' : ScrollArea"
      v-if="!isMobile && store.activeOrder"
      class="flex-1 h-full overflow-y-auto"
    >
      <OrderDetailsView
        v-if="store.activeOrderView === 'details'"
        :order="store.activeOrder"
        @back="store.closeOrderDetails"
      />
      <OrderTimeline v-else :order="store.activeOrder" />
    </component>
    <div v-else-if="store.activeOrder" class="flex-1 h-full overflow-y-auto">
      <OrderDetailsView
        v-if="store.activeOrderView === 'details'"
        :order="store.activeOrder"
        @back="store.closeOrderDetails"
      />
      <OrderTimeline v-else :order="store.activeOrder" />
    </div>
  </div>
</template>
