<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { Dialog, DialogHeader, DialogContent } from '@/components/ui/dialog'
  import { Input } from '@/components/ui/input'
  import { Button } from '@/components/ui/button'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import ProductPreview from '@/components/product-preview/ProductPreview.vue'
  import { Calendar, SwatchBook, Plus, ArrowUpDown, Check } from 'lucide-vue-next'

  import type { Locker } from '@/services/lockers/types'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import TwoDScene from './scene/TwoDScene.vue'
  import { storeToRefs } from 'pinia'
  import { useProductsStore } from '@/stores/products/products.store'
  import { InputSearchGroup } from '@/components/ui/input-search-group'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
  } from '@/components/ui/dropdown-menu'
  import { timeAgo } from '@/lib/utils'
  // import { useCustomizationStore } from '@/stores/customization/customization.store'

  type SortOption = 'lastModified' | 'alphabetical' | 'createdDate'

  const props = defineProps<{
    open: boolean
  }>()

  const emit = defineEmits(['update:open', 'save-design', 'create-locker', 'select-locker'])

  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const sortOption = ref<SortOption>('alphabetical')
  const productName = ref('')
  const selectedLockerId = ref<number | null>(null)

  const lockerStore = useLockerRoomStore()
  const workflowStore = useWorkflowStore()
  const lockerStoreRef = storeToRefs(lockerStore)
  const productsStore = useProductsStore()
  // const customizationStore = useCustomizationStore()

  const { activeProductDetails } = storeToRefs(productsStore)
  // const customizeStoreRef = storeToRefs(customizationStore)

  const lockers = computed(() => lockerStoreRef.lockers.value)

  const search = ref('')

  const filteredLockers = computed(() => {
    if (!search.value) return lockers.value
    return lockers.value.filter(l => l.room_name.toLowerCase().includes(search.value.toLowerCase()))
  })

  const handleSelectLocker = (locker: Locker) => {
    selectedLockerId.value = locker.id
    emit('select-locker', locker)
  }

  const handleSave = () => {
    // console.log(customizeStoreRef)
    if (!selectedLockerId.value) return
    emit('save-design', {
      locker_id: selectedLockerId.value,
      name: productName.value
    })
  }
  const handlePreviewToggle = () => {
    workflowStore.toggleActiveCanvasSide()
  }

  watch(
    () => props.open,
    async (newVal: boolean) => {
      if (newVal) {
        if (!lockerStoreRef.lockers.value.length) {
          await lockerStore.fetchLockers()
        }
      }
    }
  )
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent variant="large" class="w-full flex flex-col gap-0 p-0 overflow-hidden h-fit">
      <!-- HEADER -->
      <DialogHeader class="p-4">
        <h2 class="text-lg font-semibold">Save your design</h2>
      </DialogHeader>
      <div class="flex overflow-hidden p-4">
        <!-- LEFT: PRODUCT PREVIEW -->
        <div
          class="w-[60%] p-6 flex items-center justify-center bg-accent relative h-fit! rounded-[20px]"
        >
          <ProductPreview class="h-fit!" />

          <div
            v-if="!activeProductDetails?.is_3d_product"
            class="w-fit h-fit p-2 rounded-2xl backdrop-blur-sm bg-white absolute right-6 bottom-6 z-[100] cursor-pointer"
            @click="handlePreviewToggle"
          >
            <div class="size-24 flex items-center justify-center">
              <TwoDScene
                :side="workflowStore.activeCanvasSide === 'front' ? 'back' : 'front'"
                :main-preview="true"
                :canvas-width="600"
                :canvas-height="600"
                canvas-class="w-full h-full object-contain rounded-lg transition-opacity duration-300"
              />
            </div>
          </div>
        </div>

        <!-- RIGHT: LOCKER LIST -->
        <div class="w-[40%] flex flex-col p-6 pb-0! gap-3">
          <div class="flex flex-col gap-3">
            <Input v-model="productName" placeholder="Design name..." class="h-9 bg-accent" />
            <h4 class="text-sm font-semibold mb-0">Choose a Locker</h4>
            <div class="flex items-center justify-between gap-1">
              <InputSearchGroup
                v-model="search"
                placeholder="Search Locker"
                class="w-full h-9 bg-accent"
                @update:model-value="
                  (val: string | number) => {
                    search = val as string
                  }
                "
              />

              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" class="flex items-center gap-2 h-9">
                    <ArrowUpDown class="w-4 h-4" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent class="w-48">
                  <DropdownMenuItem>
                    <Check
                      :class="{ '!opacity-100': sortOption === 'lastModified' }"
                      class="w-4 h-4 opacity-0"
                    />
                    Last modified
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <Check
                      :class="{ '!opacity-100': sortOption === 'alphabetical' }"
                      class="w-4 h-4 opacity-0"
                    />
                    Alphabetically
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <Check
                      :class="{ '!opacity-100': sortOption === 'createdDate' }"
                      class="w-4 h-4 opacity-0"
                    />
                    Created date
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button class="h-9 flex items-center gap-2" @click="emit('create-locker')">
                <Plus class="w-4 h-4" /> Create locker
              </Button>
            </div>
          </div>

          <!-- LIST SECTION -->
          <ScrollArea class="flex-1 px-6 py-4 h-full overflow-y-auto p-3 border rounded-lg">
            <!-- <div class="grid gap-4 h-full"> -->
            <div
              v-for="locker in filteredLockers"
              :key="locker.id"
              class="flex gap-4 rounded-lg cursor-pointer hover:bg-accent transition mb-4 p-1 last-of-type:mb-0"
              :class="selectedLockerId === locker.id ? 'bg-primary/20' : ''"
              @click="handleSelectLocker(locker)"
            >
              <!-- THUMBNAIL -->
              <div
                class="w-20 h-20 grid gap-1 overflow-hidden rounded-md border bg-accent p-2"
                :class="[
                  locker.product_thumbnails.length === 1 && 'place-items-center',
                  locker.product_thumbnails.length === 2 && 'grid-cols-2',
                  locker.product_thumbnails.length === 3 && 'grid-cols-2 grid-rows-2',
                  locker.product_thumbnails.length >= 4 && 'grid-cols-2 grid-rows-2'
                ]"
              >
                <img
                  v-for="(img, i) in locker.product_thumbnails.slice(0, 4)"
                  :key="i"
                  :src="baseStorageUrl + img"
                  class="object-contain w-full h-full"
                />
              </div>

              <!-- META -->
              <div class="flex flex-col gap-1">
                <div class="font-medium">{{ locker.room_name }}</div>

                <div class="text-xs text-muted-foreground flex items-center gap-2">
                  <span class="flex items-center gap-1">
                    <SwatchBook class="size-3" />
                    {{ locker.product_count }} designs
                  </span>

                  <span class="w-1 h-1 rounded-full bg-muted-foreground"></span>

                  <span class="flex items-center gap-1">
                    <Calendar class="size-3" />
                    {{ timeAgo(locker.updated_at) }}
                  </span>
                </div>
              </div>
            </div>
            <!-- </div> -->
          </ScrollArea>
          <div class="flex justify-end gap-3">
            <Button variant="outline" @click="emit('update:open', false)"> Cancel </Button>
            <Button :disabled="!selectedLockerId" @click="handleSave"> Save design </Button>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
    </DialogContent>
  </Dialog>
</template>
