<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue'
  import { Checkbox } from '@/components/ui/checkbox'
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import { Loader2, Pencil, Trash2, Users } from 'lucide-vue-next'
  import { useCart } from './useCart'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    cart_note_placeholder,
    minimum_order_quantity,
    msg_failed_to_load_cart_product,
    msg_address_selected,
    msg_fill_required_fields,
    msg_select_address,
    msg_update_quantity_zero,
    msg_order_placed_success,
    cart_select_all_products,
    cart_remove_selected,
    cart_confirm_remove_single,
    cart_confirm_remove_products,
    cart_removing
  } from '@/paraglide/messages'

  import { useLoadCartProductIntoCustomizer } from '@/composables/useLoadCartProductIntoCustomizer'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useCustomizerMenu } from '@/composables/useCustomizerMenu'
  import { useCompanyStore } from '@/stores/company/company.store'
  import { useCartStore } from '@/stores/cart/cart.store'
  import { toast } from 'vue-sonner'
  import type { CustomizerStep } from '@/stores/workflow/workflow.store.types'
  import type { Address } from '@/services/customers/types'
  import ProfileDialog from '@/components/customizer-profile-section/ProfileDialog.vue'
  import { useRoster } from '@/components/customization-workflow/WorkflowSteps/roster/useRoster'
  import type { APCustomizationRosterEntry } from '@/services/products/types'
  import { API } from '@/services'
  import { extractPlacedOrderId } from '@/services/orders/orders.service'
  import { useOrdersStore } from '@/stores/orders/orders.store'
  import { Button } from '@/components/ui/button'
  import { DialogFooter } from '@/components/ui/dialog'
  import { usePricing } from '@/composables/usePricing'
  import { usePermissions } from '@/composables/usePermissions'

  const props = defineProps<{ open: boolean }>()
  const emit = defineEmits<{ 'update:open': [value: boolean] }>()

  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const workflowStore = useWorkflowStore()
  const { menuItems, goTo } = useCustomizerMenu()
  const { loadCartProductIntoCustomizer } = useLoadCartProductIntoCustomizer()
  const { replaceRoster, ensureEditableRoster } = useRoster()
  const profileStore = useProfileStore()
  const companyStore = useCompanyStore()
  const locale = computed(() => profileStore.currentLocale || 'en')
  const { showPricing } = usePricing()
  const { can } = usePermissions()
  const canSkipMoq = computed(() => can('skip-moq'))

  // Address selection state
  const showProfileDialog = ref(false)
  const showOrdersProfileDialog = ref(false)
  const selectedAddress = ref<Address | null>(null)
  const addressError = ref<string>('')
  const orderReferenceError = ref<string>('')
  const isPlacingOrder = ref(false)

  // Use the cart composable (needed before bulk-selection computeds)
  const cartStore = useCartStore()
  const {
    products,
    formatPrice,
    // formatAddons,
    removeProduct: _removeProduct,
    editProduct: _editProduct,
    totalItems,
    totalPrice,
    fetchCart,
    getItemPricingRows,
    validateCartForCheckout,
    minimumCartQuantity
  } = useCart()

  // Confirm dialog state for removing products (single id or multiple — same remove flow as one-by-one)
  const showRemoveConfirmDialog = ref(false)
  const pendingRemoveFactoryProductIds = ref<string[]>([])
  const isRemovingCartProducts = ref(false)

  /** Rows that can be selected / bulk-removed (excludes the row currently being edited in customizer). */
  const selectableFactoryProductIds = computed(() => {
    const editing = cartStore.editingFactoryProductId
    return products.value
      .filter(p => !editing || p.factory_product_id !== editing)
      .map(p => p.factory_product_id)
  })

  const selectedFactoryProductIds = ref<string[]>([])

  const selectAllCheckboxState = computed<boolean | 'indeterminate'>(() => {
    const ids = selectableFactoryProductIds.value
    if (ids.length === 0) return false
    const selected = selectedFactoryProductIds.value.filter(id => ids.includes(id))
    if (selected.length === 0) return false
    if (selected.length === ids.length) return true
    return 'indeterminate'
  })

  function toggleSelectAll() {
    const ids = selectableFactoryProductIds.value
    if (ids.length === 0) return
    const allSelected = ids.every(id => selectedFactoryProductIds.value.includes(id))
    selectedFactoryProductIds.value = allSelected ? [] : [...ids]
  }

  function toggleRowSelection(factoryProductId: string, checked: boolean) {
    if (checked) {
      if (!selectedFactoryProductIds.value.includes(factoryProductId)) {
        selectedFactoryProductIds.value = [...selectedFactoryProductIds.value, factoryProductId]
      }
    } else {
      selectedFactoryProductIds.value = selectedFactoryProductIds.value.filter(
        id => id !== factoryProductId
      )
    }
  }

  function handleBulkRemoveClick() {
    if (selectedFactoryProductIds.value.length === 0) return
    pendingRemoveFactoryProductIds.value = [...selectedFactoryProductIds.value]
    showRemoveConfirmDialog.value = true
  }

  watch(
    () => products.value.map(p => p.factory_product_id),
    idList => {
      const allowed = new Set(idList)
      selectedFactoryProductIds.value = selectedFactoryProductIds.value.filter(id =>
        allowed.has(id)
      )
    }
  )

  // Invalid quantity state (Task 2: quantity === 0 blocks checkout)
  const invalidQuantityIds = ref<string[]>([])

  // Handle remove product with confirmation
  function handleRemoveClick(factoryProductId: string) {
    pendingRemoveFactoryProductIds.value = [factoryProductId]
    showRemoveConfirmDialog.value = true
  }

  async function confirmRemoveProduct() {
    const ids = [...pendingRemoveFactoryProductIds.value]
    if (ids.length === 0) return

    isRemovingCartProducts.value = true
    try {
      for (const factoryProductId of ids) {
        await _removeProduct(factoryProductId)
      }

      selectedFactoryProductIds.value = []
      pendingRemoveFactoryProductIds.value = []
      showRemoveConfirmDialog.value = false
    } finally {
      isRemovingCartProducts.value = false
    }
  }

  function cancelRemoveProduct() {
    if (isRemovingCartProducts.value) return
    showRemoveConfirmDialog.value = false
    pendingRemoveFactoryProductIds.value = []
  }

  /** Block closing (backdrop / Esc) while deletion is in progress */
  function onRemoveConfirmDialogOpenChange(open: boolean) {
    if (isRemovingCartProducts.value && !open) return
    showRemoveConfirmDialog.value = open
    if (!open) {
      pendingRemoveFactoryProductIds.value = []
    }
  }

  const removeConfirmMessage = computed(() => {
    const n = pendingRemoveFactoryProductIds.value.length
    if (n <= 1) {
      return cart_confirm_remove_single({}, { locale: locale.value })
    }
    return cart_confirm_remove_products({ count: n }, { locale: locale.value })
  })

  function pickStepOrNextAvailable(
    desired: CustomizerStep,
    visible: CustomizerStep[]
  ): CustomizerStep {
    if (visible.includes(desired)) return desired
    const order: CustomizerStep[] = [
      'product',
      'designs',
      'styles',
      'logos',
      'colors',
      'patterns',
      'texts',
      'roster',
      'summary'
    ]
    const desiredIndex = order.indexOf(desired)
    const fallbackStart = desiredIndex >= 0 ? desiredIndex + 1 : 0
    for (let i = fallbackStart; i < order.length; i += 1) {
      const candidate = order[i]
      if (candidate && visible.includes(candidate)) return candidate
    }
    return visible[0] ?? 'product'
  }

  async function editProduct(factoryProductId: string) {
    const desiredStep = (workflowStore.activeStep || 'product') as CustomizerStep
    emit('update:open', false)

    const ok = await loadCartProductIntoCustomizer(factoryProductId)
    if (!ok) {
      toast.error(msg_failed_to_load_cart_product({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
      return
    }

    workflowStore.resetWorkflowSubSteps()
    const visibleSteps = menuItems.value.map(i => i.step)
    const nextStep = pickStepOrNextAvailable(desiredStep, visibleSteps)

    await goTo(nextStep)
  }

  async function editRoster(factoryProductId: string) {
    emit('update:open', false)

    // Load the cart product into customizer
    const ok = await loadCartProductIntoCustomizer(factoryProductId)
    if (!ok) {
      toast.error(msg_failed_to_load_cart_product({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
      return
    }

    // Extract roster data from the factory product
    let rosterEntries: APCustomizationRosterEntry[] = []
    if (cartStore.cart?.items) {
      for (const item of cartStore.cart.items) {
        const factoryProduct = item.factory_products.find(fp => fp.id === factoryProductId)
        if (factoryProduct) {
          // Extract roster from factory product
          const factoryProductRecord = factoryProduct as unknown as Record<string, unknown>
          const rosterData = factoryProductRecord['product_roster_detail']

          if (rosterData) {
            try {
              const parsed = typeof rosterData === 'string' ? JSON.parse(rosterData) : rosterData
              if (Array.isArray(parsed)) {
                rosterEntries = parsed
                  .map(item => {
                    if (typeof item === 'object' && item !== null) {
                      const rosterItem: APCustomizationRosterEntry = {
                        text: String((item as Record<string, unknown>).text || ''),
                        number: String((item as Record<string, unknown>).number || ''),
                        size: String((item as Record<string, unknown>).size || ''),
                        quantity: Number((item as Record<string, unknown>).quantity || 0)
                      }
                      const information = (item as Record<string, unknown>).information
                      if (information !== undefined && information !== null) {
                        rosterItem.information = String(information)
                      }
                      return rosterItem
                    }
                    return null
                  })
                  .filter((x): x is APCustomizationRosterEntry => x !== null)
              }
            } catch (e) {
              console.error('Failed to parse roster data:', e)
            }
          }
          break
        }
      }
    }

    // Load roster into the roster table
    if (rosterEntries.length > 0) {
      await replaceRoster(rosterEntries)
    }

    // Navigate to roster step and open edit mode
    workflowStore.resetWorkflowSubSteps()
    const visibleSteps = menuItems.value.map(i => i.step)

    if (visibleSteps.includes('roster')) {
      await goTo('roster')
      await ensureEditableRoster()
    } else {
      // If roster step is not available, go to the next available step
      const nextStep = pickStepOrNextAvailable('roster', visibleSteps)
      await goTo(nextStep)
    }
  }

  const orderReference = ref<string>('')
  const comments = ref<string>('')

  const ordersStore = useOrdersStore()

  // Computed properties
  const companyName = computed(() => {
    // Try to get company name from cart data first, then settings, then company domain
    return (
      cartStore.cart?.company_name ||
      companyStore.settings?.settings?.store_address?.company_name ||
      companyStore.company?.company_domain ||
      'Company'
    )
  })

  const open = computed({
    get: () => props.open,
    set: (value: boolean) => emit('update:open', value)
  })

  const canConfirmOrder = computed(() => {
    return selectedAddress.value !== null && orderReference.value.trim().length > 0
  })

  // Initialize default address
  onMounted(async () => {
    await profileStore.fetchAddresses()
    if (profileStore.defaultAddress) {
      selectedAddress.value = profileStore.defaultAddress
    }
  })

  // Watch for default address changes
  watch(
    () => profileStore.defaultAddress,
    newDefaultAddress => {
      if (newDefaultAddress && !selectedAddress.value) {
        selectedAddress.value = newDefaultAddress
      }
    }
  )

  // Fetch cart when dialog opens (only if not already fetched on page load)
  watch(
    () => props.open,
    isOpen => {
      if (isOpen) {
        invalidQuantityIds.value = []

        // Only fetch if not already fetched on page load
        if (!cartStore.hasFetchedOnPageLoad) {
          fetchCart()
        } else if (cartStore.cart && products.value.length === 0) {
          // If cart exists but products aren't mapped yet, force mapping
          fetchCart()
        }

        // Refresh addresses when cart opens
        profileStore.fetchAddresses()
      }
    }
  )

  watch(
    () => profileStore.defaultAddress,
    addr => {
      if (addr) {
        selectedAddress.value = addr
      }
    },
    { immediate: true }
  )

  function openAddressDialog() {
    showProfileDialog.value = true
    addressError.value = ''
  }

  function handleAddressSelect(address: Address) {
    selectedAddress.value = address
    addressError.value = ''
    toast.success(msg_address_selected({}, { locale: locale.value }), {
      position: 'top-right',
      richColors: true
    })
  }

  function validateForm(): boolean {
    let isValid = true
    addressError.value = ''
    orderReferenceError.value = ''

    if (!selectedAddress.value) {
      addressError.value = msg_select_address({}, { locale: locale.value })
      isValid = false
    }

    if (!orderReference.value.trim()) {
      orderReferenceError.value = 'Order reference is required'
      isValid = false
    }

    return isValid
  }

  function handleOrdersProfileDialogOpen(value: boolean) {
    showOrdersProfileDialog.value = value
  }

  async function handleConfirmOrder() {
    if (!validateForm()) {
      toast.error(msg_fill_required_fields({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
      return
    }

    if (!selectedAddress.value) {
      toast.error(msg_select_address({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
      return
    }

    const cartValidation = validateCartForCheckout()
    if (!cartValidation.valid) {
      invalidQuantityIds.value = cartValidation.invalidFactoryProductIds
      toast.error(msg_update_quantity_zero({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
      return
    }

    isPlacingOrder.value = true
    try {
      const payload = {
        address_id: selectedAddress.value.id,
        customer_reference_no: orderReference.value.trim(),
        general_comments: comments.value || ''
      }

      const placeResponse = await API.orders.placeOrder(payload)
      const newOrderId = extractPlacedOrderId(placeResponse)

      toast.success(msg_order_placed_success({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })

      // Refresh cart data after order placement
      await fetchCart()

      // Close cart dialog
      emit('update:open', false)

      await ordersStore.fetchOrders()

      // Open OrderDetailsView for the new order before showing profile (avoids listing-only if
      // ProfileDialog nextTick races OrdersTab, and covers APIs that omit id in the response).
      const idFromResponse = newOrderId
      const idFromFreshList = ordersStore.orders[0]?.id
      const orderIdToOpen = idFromResponse ?? idFromFreshList ?? null

      if (orderIdToOpen != null) {
        await ordersStore.openOrderDetailsById(orderIdToOpen)
      } else {
        ordersStore.closeOrderDetails()
      }

      showOrdersProfileDialog.value = true
    } catch (error) {
      console.error('Error placing order:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to place order. Please try again.'
      toast.error(errorMessage, { position: 'top-right', richColors: true })
    } finally {
      isPlacingOrder.value = false
    }
  }
</script>
<template>
  <Dialog v-model:open="open" variant="large">
    <DialogContent variant="large" class="max-w-3xl max-h-[90vh] gap-0 flex flex-col">
      <DialogHeader class="p-4 border-b sticky top-0 z-10 shrink-0">
        <DialogTitle class="text-lg font-semibold">Cart</DialogTitle>
      </DialogHeader>
      <ScrollArea class="flex-1 overflow-y-auto">
        <!-- Bulk selection -->
        <div
          v-if="products.length"
          class="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b bg-muted/40"
        >
          <label class="flex items-center gap-2 text-sm cursor-pointer select-none">
            <Checkbox
              :model-value="selectAllCheckboxState"
              :disabled="selectableFactoryProductIds.length === 0"
              @update:model-value="toggleSelectAll"
            />
            <span>{{ cart_select_all_products({}, { locale: locale }) }}</span>
          </label>
          <button
            v-if="selectedFactoryProductIds.length > 0"
            type="button"
            class="flex items-center gap-1.5 px-3 py-1.5 border border-destructive/60 text-destructive rounded-md text-sm transition-colors hover:bg-destructive/10"
            @click="handleBulkRemoveClick"
          >
            {{ cart_remove_selected({}, { locale: locale }) }}
          </button>
        </div>
        <!-- Cart Items -->
        <div class="divide-y">
          <div
            v-for="item in products"
            :key="item.factory_product_id"
            class="p-4"
            :class="{
              'border-l-4 border-red-500 bg-secondary': invalidQuantityIds.includes(
                item.factory_product_id
              )
            }"
          >
            <div class="flex gap-4">
              <div class="flex items-start pt-1 shrink-0">
                <Checkbox
                  :model-value="selectedFactoryProductIds.includes(item.factory_product_id)"
                  :disabled="cartStore.editingFactoryProductId === item.factory_product_id"
                  @update:model-value="v => toggleRowSelection(item.factory_product_id, v === true)"
                  @click.stop
                />
              </div>
              <!-- Product Image -->
              <div class="w-20 h-20 md:w-24 md:h-24 rounded-lg shrink-0 overflow-hidden border">
                <img
                  :src="baseStorageUrl + item.front_image"
                  :alt="item.product_name"
                  class="w-full h-full object-contain"
                />
              </div>

              <!-- Product Details -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="font-medium text-sm md:text-base truncate">
                    {{ item.product_name }}
                  </h3>
                  <template v-if="cartStore.editingFactoryProductId != item.factory_product_id">
                    <div class="flex items-center gap-2 shrink-0">
                      <button
                        class="flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm transition-colors hover:bg-gray-50"
                        @click="editProduct(item.factory_product_id)"
                      >
                        <Pencil class="w-3.5 h-3.5" />
                        <span class="hidden sm:inline">Edit design</span>
                      </button>
                      <button
                        class="flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm transition-colors hover:bg-gray-50"
                        @click="editRoster(item.factory_product_id)"
                      >
                        <Users class="w-3.5 h-3.5" />
                        <span class="hidden sm:inline">Edit roster</span>
                      </button>
                      <button
                        class="p-1.5 border rounded-md transition-colors hover:bg-gray-50"
                        @click="handleRemoveClick(item.factory_product_id)"
                      >
                        <Trash2 class="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </template>
                  <template v-else>
                    <span class="text-primary text-sm">Actions are disabled while editing</span>
                  </template>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-2 mt-3 text-sm">
                  <div>
                    <p class="text-gray-500 text-xs">Design ID</p>
                    <p class="font-medium">#{{ item.design_id }}</p>
                  </div>

                  <div>
                    <p class="text-gray-500 text-xs">Style</p>
                    <p class="font-medium">{{ item.style }}</p>
                  </div>
                  <div>
                    <p class="text-gray-500 text-xs">Roster</p>
                    <p class="font-medium">{{ item.roster }}</p>
                  </div>
                  <!-- <div>
                    <p class="text-gray-500 text-xs">Quantity</p>
                    <p class="font-medium">{{ item.quantity }}</p>
                  </div>
                  <div v-if="showPricing">
                    <p class="text-gray-500 text-xs">Price</p>
                    <p class="font-medium">{{ formatPrice(item.price, item.currency_symbol) }}</p>
                  </div> -->
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
                  <!-- <div>
                    <p class="text-gray-500 text-xs">Style</p>
                    <p class="font-medium">{{ item.style }}</p>
                  </div> -->
                  <!-- <div>
                    <p class="text-gray-500 text-xs">Addons</p>
                    <p class="font-medium text-gray-700">
                      {{ formatAddons(item.addons) || 'None' }}
                    </p>
                  </div> -->
                </div>

                <p
                  v-if="invalidQuantityIds.includes(item.factory_product_id)"
                  class="text-xs text-red-500 mt-2"
                >
                  Quantity must be greater than 0 to checkout.
                </p>

                <!-- Per-item pricing breakdown (Task 1) -->
                <div v-if="showPricing" class="mt-3 overflow-x-auto">
                  <table class="w-full min-w-[280px] text-sm border-collapse">
                    <thead>
                      <tr class="text-left text-gray-500 border-b">
                        <th class="py-1.5 pr-2 font-medium">Product / Addon / LogoTechnology</th>
                        <th class="py-1.5 pr-2 font-medium text-right">Qty</th>
                        <th class="py-1.5 pr-2 font-medium text-right">Unit Price</th>
                        <th class="py-1.5 pr-2 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(row, idx) in getItemPricingRows(item)"
                        :key="idx"
                        :class="{
                          'border-t font-semibold': row.type === 'subtotal'
                        }"
                      >
                        <td class="py-1.5 pr-2">{{ row.label }}</td>
                        <td class="py-1.5 pr-2 text-right">
                          {{ row.type === 'subtotal' ? '—' : row.qty }}
                        </td>
                        <td class="py-1.5 pr-2 text-right">
                          {{
                            row.type === 'subtotal'
                              ? '—'
                              : formatPrice(row.unitPrice, item.currency_symbol)
                          }}
                        </td>
                        <td class="py-1.5 pr-2 text-right">
                          {{ formatPrice(row.total, item.currency_symbol) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Section -->
        <div class="border-t p-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Business Info -->
            <div>
              <p class="text-gray-500 text-xs mb-1">Business</p>
              <p class="font-semibold">{{ companyName }}</p>
              <p class="text-gray-500 text-xs mt-3 mb-1">Default address</p>
              <div v-if="selectedAddress" class="text-sm space-y-0.5">
                <p v-if="selectedAddress.address1">{{ selectedAddress.address1 }}</p>
                <p v-if="selectedAddress.address2">{{ selectedAddress.address2 }}</p>
                <p>
                  <span v-if="selectedAddress.zip_code">{{ selectedAddress.zip_code }} </span>
                  <span v-if="selectedAddress.city">{{ selectedAddress.city }}</span>
                  <span v-if="selectedAddress.state">, {{ selectedAddress.state }}</span>
                </p>
                <p v-if="selectedAddress.country?.name">{{ selectedAddress.country.name }}</p>
              </div>
              <div v-else class="text-sm text-gray-500">No address selected</div>
              <button
                class="mt-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium transition-colors hover:bg-gray-50"
                @click="openAddressDialog"
              >
                Choose different address
              </button>
              <p v-if="addressError" class="text-xs text-red-500 mt-1">{{ addressError }}</p>
            </div>

            <!-- Additional Information -->
            <div>
              <p class="text-gray-500 text-xs mb-1">Additional information</p>
              <div class="space-y-3">
                <div>
                  <label class="text-sm font-medium"
                    >Order reference <span class="text-red-500">*</span></label
                  >
                  <input
                    v-model="orderReference"
                    type="text"
                    :class="[
                      'mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                      orderReferenceError ? 'border-red-500' : ''
                    ]"
                  />
                  <p v-if="orderReferenceError" class="text-xs text-red-500 mt-1">
                    {{ orderReferenceError }}
                  </p>
                </div>
                <div>
                  <label class="text-sm font-medium">Comments</label>
                  <textarea
                    v-model="comments"
                    rows="3"
                    :placeholder="cart_note_placeholder({}, { locale })"
                    class="mt-1 w-full px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <!-- Order Summary -->
            <div>
              <p class="text-gray-500 text-xs mb-3">Order summary</p>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">{{ totalItems }} items</span>
                  <span v-if="showPricing">{{ formatPrice(totalPrice) }}</span>
                </div>
                <div v-if="showPricing" class="flex justify-between">
                  <span class="text-gray-600">Sales tax</span>
                  <span class="text-gray-500">Calculated later</span>
                </div>
                <div v-if="showPricing" class="flex justify-between">
                  <span class="text-gray-600">Delivery fee</span>
                  <span class="text-gray-500">Calculated later</span>
                </div>
                <div v-if="showPricing" class="flex justify-between font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>{{ formatPrice(totalPrice) }}</span>
                </div>
                <div v-if="!canSkipMoq">
                  <span
                    class="text-xs"
                    :class="totalItems < minimumCartQuantity() ? 'text-red-500' : 'text-green-500'"
                  >
                    {{
                      minimum_order_quantity({}, { locale: profileStore.currentLocale })
                    }}:&nbsp;{{ minimumCartQuantity() }}
                  </span>
                </div>
              </div>
              <button
                class="w-full mt-4 px-4 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="
                  !canConfirmOrder ||
                  isPlacingOrder ||
                  (!canSkipMoq && totalItems < minimumCartQuantity())
                "
                @click="handleConfirmOrder"
              >
                {{ isPlacingOrder ? 'Placing order...' : 'Confirm order' }}
              </button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </DialogContent>

    <!-- Profile Dialog for Address Selection -->
    <ProfileDialog
      :open="showProfileDialog"
      :initial-tab="'address'"
      :show-select-address-button="true"
      @update:open="showProfileDialog = $event"
      @select-address="handleAddressSelect"
    />

    <!-- Profile Dialog for Orders (after order placement) -->
    <ProfileDialog
      :open="showOrdersProfileDialog"
      :initial-tab="'orders'"
      @update:open="handleOrdersProfileDialogOpen"
    />

    <!-- Remove Product Confirm Dialog -->
    <Dialog :open="showRemoveConfirmDialog" @update:open="onRemoveConfirmDialogOpenChange">
      <DialogContent class="sm:max-w-md z-[9999]">
        <DialogHeader>
          <DialogTitle>Remove Product</DialogTitle>
        </DialogHeader>

        <p class="text-sm text-muted-foreground mt-2">
          {{ removeConfirmMessage }}
        </p>

        <DialogFooter class="mt-6 flex gap-2 justify-end">
          <Button variant="outline" :disabled="isRemovingCartProducts" @click="cancelRemoveProduct">
            Cancel
          </Button>
          <Button
            variant="destructive"
            :disabled="isRemovingCartProducts"
            @click="confirmRemoveProduct"
          >
            <Loader2
              v-if="isRemovingCartProducts"
              class="mr-2 size-4 animate-spin"
              aria-hidden="true"
            />
            {{ isRemovingCartProducts ? cart_removing({}, { locale: locale }) : 'Remove' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Dialog>
</template>
