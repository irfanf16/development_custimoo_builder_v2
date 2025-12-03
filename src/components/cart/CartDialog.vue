<template>
  <Dialog v-model:open="open" variant="large">
    <DialogContent variant="large" class="max-w-3xl max-h-[90vh] gap-0 flex flex-col">
      <DialogHeader class="p-4 border-b sticky top-0 bg-white z-10 flex-shrink-0">
        <DialogTitle class="text-lg font-semibold">Cart</DialogTitle>
      </DialogHeader>

      <ScrollArea class="flex-1 overflow-y-auto">
        <!-- Cart Items -->
        <div class="divide-y">
          <div v-for="item in products" :key="item.product_id" class="p-4">
            <div class="flex gap-4">
              <!-- Product Image -->
              <div
                class="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden"
              >
                <img src="" :alt="item.product_name" class="w-full h-full object-contain" />
              </div>

              <!-- Product Details -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="font-medium text-sm md:text-base truncate">
                    {{ item.product_name }}
                  </h3>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button
                      class="flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 transition-colors"
                      @click="editProduct(item.product_id)"
                    >
                      <Pencil class="w-3.5 h-3.5" />
                      <span class="hidden sm:inline">Edit design</span>
                    </button>
                    <button
                      class="p-1.5 border rounded-md hover:bg-gray-50 transition-colors"
                      @click="removeProduct(item.product_id)"
                    >
                      <Trash2 class="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-3 text-sm">
                  <div>
                    <p class="text-gray-500 text-xs">Design ID</p>
                    <p class="font-medium">#{{ item.design_id }}</p>
                  </div>
                  <div>
                    <p class="text-gray-500 text-xs">Quantity</p>
                    <p class="font-medium">{{ item.quantity }}</p>
                  </div>
                  <div>
                    <p class="text-gray-500 text-xs">Price</p>
                    <p class="font-medium">{{ formatPrice(item.price) }}</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
                  <div>
                    <p class="text-gray-500 text-xs">Style</p>
                    <p class="font-medium">{{ item.style }}</p>
                  </div>
                  <div>
                    <p class="text-gray-500 text-xs">Addons</p>
                    <p class="font-medium text-gray-700">
                      {{ formatAddons(item.addons) || 'None' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Section -->
        <div class="border-t bg-gray-50 p-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Business Info -->
            <div>
              <p class="text-gray-500 text-xs mb-1">Business</p>
              <p class="font-semibold">{{ businessInfo.name }}</p>
              <p class="text-gray-500 text-xs mt-3 mb-1">Default address</p>
              <p class="text-sm">{{ businessInfo.address.street }}</p>
              <p class="text-sm">{{ businessInfo.address.city }}</p>
              <p class="text-sm">{{ businessInfo.address.country }}</p>
              <button
                class="mt-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-white transition-colors"
              >
                Choose different address
              </button>
            </div>

            <!-- Additional Information -->
            <div>
              <p class="text-gray-500 text-xs mb-1">Additional information</p>
              <div class="space-y-3">
                <div>
                  <label class="text-sm font-medium">Order reference</label>
                  <input
                    v-model="orderReference"
                    type="text"
                    class="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium">Comments</label>
                  <textarea
                    v-model="comments"
                    rows="3"
                    placeholder="A short note about what type of comments make sense.."
                    class="mt-1 w-full px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                  <span>{{ formatPrice(totalPrice) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Sales tax</span>
                  <span class="text-gray-500">Calculated later</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Delivery fee</span>
                  <span class="text-gray-500">Calculated later</span>
                </div>
                <div class="flex justify-between font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>{{ formatPrice(totalPrice) }}</span>
                </div>
              </div>
              <button
                class="w-full mt-4 px-4 py-3 bg-teal-500 text-white rounded-md font-medium hover:bg-teal-600 transition-colors"
              >
                Confirm order
              </button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import { Pencil, Trash2 } from 'lucide-vue-next'
  import { useCart } from './useCart'

  const props = defineProps<{ open: boolean }>()
  const emit = defineEmits<{ 'update:open': [value: boolean] }>()

  interface BusinessAddress {
    street: string
    city: string
    country: string
  }

  interface BusinessInfo {
    name: string
    address: BusinessAddress
  }

  // Use the cart composable
  const {
    products,
    formatPrice,
    formatAddons,
    removeProduct,
    editProduct,
    totalItems,
    totalPrice
  } = useCart()

  const orderReference = ref<string>('')
  const comments = ref<string>('')

  // Computed property to handle v-model binding
  const open = computed({
    get: () => props.open,
    set: (value: boolean) => emit('update:open', value)
  })

  const businessInfo = ref<BusinessInfo>({
    name: 'EDL ApS',
    address: {
      street: 'Njalsgade 21f, 6. sal',
      city: '2300 København S',
      country: 'Denmark'
    }
  })
</script>
