<template>
  <div class="p-4 space-y-6">
    <div class="flex flex-col gap-4">
      <div v-for="(item, idx) in order.items || []" :key="`item-${idx}`" class="border rounded p-3">
        <div class="font-semibold text-gray-800 mb-2">Factory {{ idx + 1 }}</div>
        <div
          class="text-xs inline-flex px-2 py-1 rounded-full"
          :style="{
            backgroundColor: getStatusColor(item.status).bg,
            color: getStatusColor(item.status).text
          }"
        >
          {{ item.status?.replace(/_/g, ' ') || 'Unknown' }}
        </div>

        <!-- Basic timeline placeholder: list status_activities if present -->
        <div class="mt-3 space-y-3">
          <div
            v-for="(act, aIdx) in getActivities(item)"
            :key="`act-${aIdx}`"
            class="border-l-2 pl-3"
          >
            <div class="text-sm font-medium">{{ act.title }}</div>
            <div class="text-xs text-gray-500">{{ act.time }}</div>
            <div v-if="act.message" class="text-sm text-gray-700 mt-1">{{ act.message }}</div>
          </div>
          <div v-if="!getActivities(item).length" class="text-sm text-gray-500">
            No timeline entries.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { Order } from '@/services/orders/types'
  import { getStatusColor } from '@/helpers/orderStatuses'

  defineProps<{ order: Order }>()

  function getActivities(item: unknown): { title: string; time?: string; message?: string }[] {
    const it: any = item
    if (!it?.status_activities || !Array.isArray(it.status_activities)) return []
    return it.status_activities.map((a: any) => ({
      title: a?.status ?? 'Activity',
      time: a?.created_at,
      message: a?.message || a?.note || ''
    }))
  }
</script>
