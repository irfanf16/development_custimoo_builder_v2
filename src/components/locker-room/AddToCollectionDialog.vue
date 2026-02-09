<script setup lang="ts">
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
  import { Button } from '@/components/ui/button'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { onMounted } from 'vue'
  import { storeToRefs } from 'pinia'
  import type { Collection } from '@/services/lockers/types'

  defineProps<{
    open: boolean
  }>()

  const emit = defineEmits<{
    (e: 'close'): void
    (e: 'collection-selected', collection: Collection): void
  }>()

  const lockerRoomStore = useLockerRoomStore()
  const { collections } = storeToRefs(lockerRoomStore)

  onMounted(async () => {
    if (collections.value.length === 0) {
      await lockerRoomStore.fetchCollections()
    }
  })

  const handleSelectCollection = async (collection: Collection) => {
    // Fetch collection details if not already fetched
    if (!collection.details_fetched) {
      await lockerRoomStore.fetchCollectionProducts(collection.id)
      const updatedCollection = collections.value.find(c => c.id === collection.id)
      if (updatedCollection) {
        emit('collection-selected', updatedCollection)
      }
    } else {
      emit('collection-selected', collection)
    }
    emit('close')
  }
</script>

<template>
  <Dialog :open="open" @update:open="emit('close')">
    <DialogContent variant="default" class="p-6">
      <DialogHeader class="mb-4">
        <DialogTitle class="text-lg font-semibold">Add to Collection</DialogTitle>
      </DialogHeader>

      <div class="space-y-2 max-h-[400px] overflow-y-auto">
        <div
          v-for="collection in collections.filter(c => !c.room_id)"
          :key="collection.id"
          class="flex items-center justify-between p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
          @click="handleSelectCollection(collection)"
        >
          <div class="flex flex-col">
            <span class="font-medium">{{ collection.name }}</span>
            <span class="text-xs text-muted-foreground">
              {{ collection.collection_products_count || 0 }} products
            </span>
          </div>
          <Button variant="ghost" size="sm">Select</Button>
        </div>

        <div v-if="collections.length === 0" class="text-center py-8 text-muted-foreground">
          No collections available
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
