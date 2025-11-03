<script setup lang="ts">
  defineProps<{ order: any }>()
  const emit = defineEmits<{
    (e: 'cancel', order: any): void
    (e: 'pdf', order: any): void
    (e: 'details', order: any): void
  }>()
</script>

<template>
  <div class="border rounded-lg p-3 flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <div class="size-10 rounded-md bg-muted" />
      <div class="flex flex-col">
        <div class="font-medium">{{ order.name || 'Order' }}</div>
        <div class="text-xs text-muted-foreground">#{{ order.order_no || order.id }}</div>
      </div>
    </div>
    <div class="text-xs text-muted-foreground">
      {{ order.created_at || order.date }} • {{ order.status }} • Qty:
      {{ order.total_qty || order.quantity || 0 }}
    </div>
    <div class="mt-auto flex items-center justify-end gap-2">
      <button class="text-xs underline" @click="emit('cancel', order)">Cancel</button>
      <button class="text-xs underline" @click="emit('pdf', order)">PDF</button>
      <button class="text-xs underline" @click="emit('details', order)">Details</button>
    </div>
  </div>
</template>

<style scoped></style>
