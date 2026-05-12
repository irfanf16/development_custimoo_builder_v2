<script setup lang="ts">
  import { onMounted, computed, watch, nextTick, ref } from 'vue'
  import { useDebounceFn } from '@vueuse/core'
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
  import { useScrollAreaFill } from '@/composables/useScrollAreaFill'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { m as messages } from '@/paraglide/messages'

  const store = useOrdersStore()
  const profileStore = useProfileStore()
  const emit = defineEmits<{ (e: 'reorder-success'): void }>()

  const SEARCH_INPUT_SELECTOR = 'input[data-orders-search-input="true"]'
  const searchInputEl = ref<HTMLInputElement | null>(null)
  const LOAD_REFOCUS_WINDOW_MS = 400
  let lastLoadCompletionAt = 0

  const interactiveTags = new Set(['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A', 'SUMMARY'])

  function isInteractiveElement(el: HTMLElement | null) {
    if (!el) return false
    if (interactiveTags.has(el.tagName)) return true
    if (typeof el.tabIndex === 'number' && el.tabIndex >= 0) return true
    return false
  }

  function getSearchInputEl() {
    if (searchInputEl.value?.isConnected) {
      return searchInputEl.value
    }
    if (typeof document === 'undefined') return null
    const queried = document.querySelector<HTMLInputElement>(SEARCH_INPUT_SELECTOR)
    if (queried) {
      searchInputEl.value = queried
    }
    return queried
  }

  function restoreSearchFocus() {
    if (typeof window === 'undefined') return
    nextTick(() => {
      const el = getSearchInputEl()
      if (!el) return
      el.focus({ preventScroll: true })
    })
  }

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

  function onSearchFocus(e: FocusEvent) {
    const target = e.target as HTMLInputElement | null
    if (target) {
      searchInputEl.value = target
    }
  }

  function onSearchBlur(e: FocusEvent) {
    const related = e.relatedTarget as HTMLElement | null
    const target = e.target as HTMLInputElement | null
    if (target) {
      searchInputEl.value = target
    }
    const finishedLoadRecently = Date.now() - lastLoadCompletionAt <= LOAD_REFOCUS_WINDOW_MS
    const shouldRestoreFocus =
      (store.isLoadingOrders || finishedLoadRecently) && !isInteractiveElement(related)
    if (shouldRestoreFocus) {
      restoreSearchFocus()
    }
  }

  // Debounced search function
  const debouncedFilterOrders = useDebounceFn(() => {
    store.filterOrders()
  }, 600)

  // Watch search input and trigger debounced search
  watch(
    () => store.ordersParams.search,
    () => {
      debouncedFilterOrders()
    }
  )

  watch(
    () => store.isLoadingOrders,
    next => {
      if (!next) {
        lastLoadCompletionAt = Date.now()
      }
    }
  )

  onMounted(() => {
    // If on timeline view and activeOrder exists, fetch fresh details
    if (store.activeOrder?.id && store.activeOrderView === 'timeline') {
      store.fetchOrderDetails(store.activeOrder.id)
    }

    // Refetch orders every time the tab is opened so the list is up to date
    const query = new URLSearchParams()
    const { search, filter } = store.ordersParams
    if (search) query.set('search', search)
    if (filter) query.set('filter', filter)
    const params = query.toString() ? `?${query.toString()}` : ''
    store.fetchOrders(params)
  })

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

  const ordersShellRef = ref<HTMLElement | null>(null)
  const ordersChromeMeasureRef = ref<HTMLElement | null>(null)
  const { scrollAreaStyle: ordersScrollAreaStyle } = useScrollAreaFill({
    shellRef: ordersShellRef,
    headerRef: ordersChromeMeasureRef
  })
</script>

<template>
  <div ref="ordersShellRef" class="flex min-h-0 h-full flex-col overflow-hidden" data-testid="profile-orders-root">
    <div ref="ordersChromeMeasureRef" class="shrink-0">
      <!-- Header -->
      <div class="sticky top-0 z-10 w-max px-4 pb-3 pt-4">
        <WorkflowBreadcrumbs :breadcrumbs="breadcrumbs" />
      </div>
      <!-- Filter -->
      <div
        v-if="!store.activeOrder"
        class="flex items-center justify-between gap-2 border-b px-4 pb-2"
      >
        <div class="relative w-full">
          <Input
            v-model="store.ordersParams.search"
            :placeholder="t.searchOrders"
            class="h-8 w-full pl-8 pr-8 bg-muted"
            data-orders-search-input="true"
            data-testid="profile-orders-input-search"
            @focus="onSearchFocus"
            @blur="onSearchBlur"
          />
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-foreground" />
          <button
            v-show="store.ordersParams.search"
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
                class="px-2 h-8 shadow-none bg-muted hover:bg-muted/80"
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
                  : 'bg-muted text-foreground'
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
                  : 'bg-muted text-foreground'
              ]"
              @click="store.setView('expanded-list')"
            >
              <i-flex-line-grid-view class="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
    <!-- Orders List -->
    <ScrollArea
      v-if="!store.activeOrder"
      :style="ordersScrollAreaStyle"
      class="min-h-0 w-full min-w-0"
    >
      <InfiniteScroll :class="'w-full relative'" @load-more="loadMore">
        <div v-if="store.orders.length">
          <OrdersListItem
            v-for="order in store.orders"
            :key="order.id"
            :order="order"
            :expanded="store.ordersView === 'expanded-list'"
            @cancel="store.cancelOrder"
            @pdf="() => {}"
            @details="() => showOrderDetails(order)"
            @reorder-success="emit('reorder-success')"
          />
        </div>
        <div v-else-if="!store.isLoadingOrders" class="flex justify-center py-10 text-foreground">
          {{ t.noOrdersFound }}
        </div>

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
    <ScrollArea v-else :style="ordersScrollAreaStyle" class="min-h-0 w-full min-w-0">
      <OrderDetailsView
        v-if="store.activeOrderView === 'details'"
        :order="store.activeOrder"
        @back="store.closeOrderDetails"
        @reorder-success="emit('reorder-success')"
      />
      <OrderTimeline v-else :order="store.activeOrder" />
    </ScrollArea>
  </div>
</template>
