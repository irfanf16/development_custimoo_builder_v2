<script setup lang="ts">
  import { ref, watch, computed } from 'vue'
  import Draggable from 'vuedraggable'
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
  import { X, Eye, EyeOff } from 'lucide-vue-next'
  import { Button } from '@/components/ui/button'
  type SortOption = 'lastModified' | 'alphabetical' | 'createdDate'

  const props = withDefaults(
    defineProps<{
      products?: CollectionProduct[]
      sort: SortOption
    }>(),
    { products: () => [], sort: 'lastModified' }
  )

  const emit = defineEmits<{
    (e: 'remove-product', index: number): void
  }>()
  const computedProducts = computed(() => [...props.products])
  const filteredProducts = computed(() => {
    return [...computedProducts.value].sort((a, b) => {
      switch (props.sort) {
        case 'alphabetical':
          return a.product_nickname.localeCompare(b.product_nickname)

        case 'createdDate':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

        case 'lastModified':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })
  })
  const localProducts = ref<CollectionProduct[]>([...filteredProducts.value])

  watch(
    () => filteredProducts.value,
    newVal => {
      localProducts.value = [...newVal]
    }
  )

  const isDragging = ref(false)
  const dropIndex = ref<number | null>(null)
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')

  const onMove = (evt: any) => {
    dropIndex.value = evt.dragged.__draggable_context.index
    return true
  }
</script>

<template>
  <Draggable
    v-model="localProducts"
    item-key="id"
    tag="div"
    class="grid grid-cols-1 md:grid-cols-4 gap-6"
    animation="250"
    ghost-class="drag-ghost"
    chosen-class="drag-chosen"
    drag-class="dragging"
    @move="onMove"
    @start="() => (isDragging = true)"
    @end="
      () => {
        isDragging = false
        dropIndex = null
      }
    "
  >
    <template #header>
      <span v-show="false"></span>
    </template>
    <template #item="{ element, index }">
      <div class="relative">
        <div
          v-if="isDragging && dropIndex === index"
          class="absolute inset-0 rounded-xl bg-primary/80 ring-2 ring-primary backdrop-blur-sm transition-all duration-200 ease-out pointer-events-none z-[100]"
        />
        <Card
          :key="index"
          class="rounded-xl p-4 space-y-3 cursor-move transition-all duration-200 relative"
        >
          <button
            class="absolute top-2 right-2 z-10 rounded-full bg-background border p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
            @click.stop="emit('remove-product', index)"
          >
            <X class="w-3 h-3" />
          </button>
          <!-- Image -->
          <div class="aspect-4/3 bg-muted rounded-md overflow-hidden w-full">
            <img
              :src="baseStorageUrl + element.product_urls.front_url"
              class="w-full h-full object-contain"
            />
          </div>

          <!-- Form (hidden while dragging) -->
          <div v-if="!isDragging" class="space-y-2">
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs text-muted-foreground">{{
                  locker_product_nickname_label({}, { locale })
                }}</label>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-6 w-6 p-0"
                  @click.stop="element.allow_title = !element.allow_title"
                >
                  <Eye v-if="element.allow_title" class="h-3 w-3" />
                  <EyeOff v-else class="h-3 w-3" />
                </Button>
              </div>
              <Input v-model="element.product_nickname" />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs text-muted-foreground">{{
                  locker_product_description_label({}, { locale })
                }}</label>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-6 w-6 p-0"
                  @click.stop="element.allow_description = !element.allow_description"
                >
                  <Eye v-if="element.allow_description" class="h-3 w-3" />
                  <EyeOff v-else class="h-3 w-3" />
                </Button>
              </div>
              <Input
                v-model="element.product_note"
                :placeholder="locker_description_placeholder({}, { locale })"
              />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs text-muted-foreground">{{
                  locker_price_label({}, { locale })
                }}</label>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-6 w-6 p-0"
                  @click.stop="element.allow_price = !element.allow_price"
                >
                  <Eye v-if="element.allow_price" class="h-3 w-3" />
                  <EyeOff v-else class="h-3 w-3" />
                </Button>
              </div>
              <Input v-model="element.product_price" type="number" placeholder="50" />
            </div>
          </div>
        </Card>
      </div>
    </template>
  </Draggable>
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
