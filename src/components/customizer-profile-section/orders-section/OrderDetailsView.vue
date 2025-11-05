<template>
  <div class="p-4 space-y-6">
    <!-- Order Info -->
    <div class="border-b pb-3">
      <OrderSummaryHeader
        :order="order"
        :show-timeline="true"
        @cancel="store.cancelOrder"
        @pdf="() => {}"
        @details="() => {}"
      />
    </div>

    <!-- Product List -->
    <div class="flex flex-col gap-4">
      <div
        v-for="(item, index) in order.items || []"
        :key="index"
        class="flex flex-col gap-4 border p-3 rounded-lg hover:shadow-sm transition"
      >
        <div
          v-for="(product, pIdx) in item.factory_products || []"
          :key="`prod-${pIdx}`"
          class="flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <!-- Image -->
          <div class="relative group">
            <img
              v-if="!product.is_custom_product"
              :src="`${storage_url}${product.front_image || '/placeholder.png'}`"
              alt="Product"
              class="w-24 h-24 object-cover rounded-md border"
            />
            <img
              v-else
              :src="`${storage_url}${product.custom_product_placeholder || '/placeholder.png'}`"
              alt="Custom Product"
              class="w-24 h-24 object-cover rounded-md border"
            />
            <div
              class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex justify-center items-center gap-2 rounded-md transition"
            >
              <button
                class="bg-white rounded-full p-1.5 shadow hover:bg-gray-100 transition"
                title="Save"
              >
                <i-flex-line-save class="size-4" />
              </button>
              <button
                class="bg-white rounded-full p-1.5 shadow hover:bg-gray-100 transition"
                title="Share"
              >
                <i-flex-line-share class="size-4" />
              </button>
              <button
                class="bg-white rounded-full p-1.5 shadow hover:bg-gray-100 transition"
                title="Add to Cart"
              >
                <i-flex-line-cart class="size-4" />
              </button>
              <button
                class="bg-white rounded-full p-1.5 shadow hover:bg-gray-100 transition"
                title="Reorder"
              >
                <i-flex-line-reorder class="size-4" />
              </button>
            </div>
          </div>

          <!-- Product Info -->
          <div class="flex-1 flex flex-col gap-1">
            <div class="font-semibold text-gray-800">{{ product.product_name || 'Unnamed' }}</div>
            <div class="text-sm text-gray-500">
              Quantity: {{ product.prices?.total_quantity ?? product.roster_quantity ?? 0 }}
            </div>
            <div
              class="text-xs px-2 py-1 rounded w-fit font-medium capitalize"
              :style="{
                backgroundColor: getStatusColor(item.status).bg,
                color: getStatusColor(item.status).text
              }"
            >
              {{ item.status?.replace(/_/g, ' ') || 'Unknown' }}
            </div>

            <!-- Actions below quantity -->
            <div class="flex items-center gap-2 mt-2">
              <button
                class="bg-gray-100 text-gray-700 p-1.5 rounded hover:bg-gray-200"
                title="Save"
              >
                <i-flex-line-save class="size-4" />
              </button>
              <button
                class="bg-gray-100 text-gray-700 p-1.5 rounded hover:bg-gray-200"
                title="Share"
              >
                <i-flex-line-share class="size-4" />
              </button>
              <button
                class="bg-gray-100 text-gray-700 p-1.5 rounded hover:bg-gray-200"
                title="Add to Cart"
              >
                <i-flex-line-cart class="size-4" />
              </button>
              <button
                class="bg-gray-100 text-gray-700 p-1.5 rounded hover:bg-gray-200"
                title="Reorder"
              >
                <i-flex-line-reorder class="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="pt-4">
      <button class="text-primary hover:underline text-sm font-medium" @click="$emit('back')">
        ← Back to Orders
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { defineProps, defineEmits } from 'vue'
  import { getStatusColor } from '@/helpers/orderStatuses'
  import OrderSummaryHeader from './OrderSummaryHeader.vue'
  import type { Order } from '@/services/orders/types'
  import { useProfileStore } from '@/stores/profile/profile.store'

  defineProps<{ order: Order }>()
  defineEmits<{ (e: 'back'): void }>()
  const storage_url = (import.meta.env.VITE_APP_STORAGE_URL as string) || ''
  const store = useProfileStore()
</script>
