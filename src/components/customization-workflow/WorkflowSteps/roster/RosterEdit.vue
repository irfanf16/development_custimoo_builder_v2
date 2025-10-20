<script setup lang="ts">
  import { Button } from '@/components/ui/button'
</script>

<template>
  <div class="p-4 md:p-6">
    <div class="flex flex-col gap-3">
      <div v-for="i in 10" :key="i" class="grid grid-cols-12 gap-2 items-center">
        <input class="col-span-5 h-9 rounded border border-input px-2" placeholder="Name" />
        <input class="col-span-2 h-9 rounded border border-input px-2" placeholder="No." />
        <select class="col-span-3 h-9 rounded border border-input px-2">
          <option>S</option>
          <option>M</option>
          <option>L</option>
          <option>XL</option>
        </select>
        <input class="col-span-1 h-9 rounded border border-input px-2" placeholder="Qty." />
        <button class="col-span-1 text-muted-foreground">🗑️</button>
      </div>
      <div class="flex justify-between mt-4">
        <Button variant="default" class="w-48">Cancel</Button>
        <Button variant="default" class="w-48">Save</Button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
