<script setup lang="ts">
  import { defineProps, defineEmits } from 'vue'

  defineProps<{
    order: {
      id: number | string
      order_no?: string
      customer_name?: string
      created_at?: string
      status?: string
      total_quantity?: number
    }
  }>()

  const emit = defineEmits(['cancel', 'pdf', 'details'])
</script>

<template>
  <div class="flex flex-col gap-2 py-3 border-b border-gray-200">
    <!-- Top Row: Order Name + Buttons -->
    <div class="flex items-center justify-between">
      <div>
        <div class="font-semibold text-gray-800">
          {{ order.customer_name || 'Unnamed Customer' }}
        </div>
        <div class="text-sm text-gray-500">Order ID: {{ order.order_no || order.id }}</div>
      </div>

      <div class="flex items-center gap-2">
        <button class="text-sm text-red-500 hover:underline" @click="emit('cancel', order)">
          Cancel
        </button>
        <button class="text-sm text-blue-500 hover:underline" @click="emit('pdf', order)">
          PDF
        </button>
        <button class="text-sm text-gray-700 hover:underline" @click="emit('details', order)">
          Details
        </button>
      </div>
    </div>

    <!-- Middle Row: Status -->
    <div class="flex justify-center items-center">
      <span
        class="text-xs px-3 py-1 rounded-full font-medium"
        :class="{
          'bg-green-100 text-green-700': order.status === 'completed',
          'bg-yellow-100 text-yellow-700': order.status === 'pending',
          'bg-red-100 text-red-700': order.status === 'cancelled'
        }"
      >
        {{ order.status || 'Unknown' }}
      </span>
    </div>

    <!-- Bottom Row: Date + Quantity -->
    <div class="flex justify-between items-center text-xs text-gray-500">
      <div>Created: {{ order.created_at || 'N/A' }}</div>
      <div>Total Quantity: {{ order.total_quantity || 0 }}</div>
    </div>
  </div>
</template>
