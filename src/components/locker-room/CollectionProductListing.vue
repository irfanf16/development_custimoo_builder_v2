<script setup lang="ts">
  import { ref, watch, computed } from 'vue'
  // import draggable from 'vuedraggable'
  import { Card } from '@/components/ui/card'
  import { Input } from '@/components/ui/input'
  import type { CollectionProduct } from '@/services/lockers/types'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    locker_description_placeholder,
    locker_product_nickname_label,
    locker_product_description_label,
    locker_price_label
  } from '@/paraglide/messages'
  const props = withDefaults(
    defineProps<{
      products?: CollectionProduct[]
    }>(),
    {
      products: () => []
    }
  )

  /**
   * Draggable MUST use a ref
   */
  const localProducts = ref<CollectionProduct[]>(
    Array.isArray(props.products) ? [...props.products] : []
  )
  watch(
    () => props.products,
    val => {
      if (Array.isArray(val)) {
        localProducts.value = [...val]
      }
    }
  )

  const isDragging = ref(false)
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
    <!-- v-model="localProducts"
  :item-key="(_: any, index: number) => index"
  ghost-class="drop-ghost"
  chosen-class="drag-chosen"
  drag-class="drag-active"
  :animation="250"
  @start="isDragging = true"
  @end="isDragging = false" -->
    <!-- <template #item="{ element, index }"> -->
    <!-- <div> -->
    <Card
      v-for="(element, index) in localProducts"
      :key="index"
      class="rounded-xl p-4 space-y-3 cursor-move transition-all duration-200"
    >
      <!-- Image -->
      <div class="aspect-4/3 bg-muted rounded-md overflow-hidden w-full">
        <img
          :src="baseStorageUrl + element.product_locker_room.front_url"
          class="w-full h-full object-contain"
        />
      </div>

      <!-- Form (hidden while dragging) -->
      <div v-if="!isDragging" class="space-y-2">
        <div>
          <label class="text-xs text-muted-foreground">{{
            locker_product_nickname_label({}, { locale })
          }}</label>
          <Input v-model="element.product_nickname" />
        </div>

        <div>
          <label class="text-xs text-muted-foreground">{{
            locker_product_description_label({}, { locale })
          }}</label>
          <Input
            v-model="element.product_note"
            :placeholder="locker_description_placeholder({}, { locale })"
          />
        </div>

        <div>
          <label class="text-xs text-muted-foreground">{{
            locker_price_label({}, { locale })
          }}</label>
          <Input v-model="element.product_price" type="number" placeholder="50" />
        </div>
      </div>
    </Card>
    <!-- </div> -->
    <!-- </template>
    <template #header>
      <button v-show="false"></button>
    </template> -->
  </div>
</template>
<style scoped>
  /* Card being dragged */
  .drag-chosen {
    opacity: 0.9;
    transform: scale(1.02);
  }

  /* Placeholder where card will drop */
  .drop-ghost {
    background-color: hsl(var(--primary) / 0.3);
    border-radius: 1rem;
    min-height: 220px;
  }

  /* While actively dragging */
  .drag-active {
    cursor: grabbing;
  }
</style>
