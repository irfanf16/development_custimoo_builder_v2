<script setup lang="ts">
  import { AvatarQueue } from '@/components/ui/avatar-queue'
  import { Button } from '@/components/ui/button'
  import { DialogFooter } from '@/components/ui/dialog'
  import { Separator } from '@/components/ui/separator'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
  import type { Locker, LockerProduct } from '@/services/lockers/types'
  import { Copy, FolderArchive, PlusIcon, ShoppingBasket, TrashIcon, X } from 'lucide-vue-next'
  import { computed } from 'vue'

  import { confirmDialog } from '@/lib/confirm-dialog'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import type LockerProductsListing from './LockerProductsListing.vue'
  import { useUIStore } from '@/stores/ui/ui.store'
  type LockerTab = 'products' | 'assets' | 'colours' | 'rosters'
  interface FooterProps {
    currentTab: 'lockers' | 'collections'
    detailsTab: LockerTab
    currentMode: 'list' | 'detail'
    selectedProducts: LockerProduct[]
    selectedLockers: Array<string | number>
    lockerProductsRef?: InstanceType<typeof LockerProductsListing> | null
    currentLocker: Locker | null
  }
  const props = withDefaults(defineProps<FooterProps>(), {
    currentTab: 'lockers',
    detailsTab: 'products',
    currentMode: 'list',
    selectedProducts: () => [],
    lockerProductsRef: null
  })

  const emit = defineEmits(['back'])
  const uiStore = useUIStore()
  const lockerRoomStore = useLockerRoomStore()
  const products = computed(() => props.selectedProducts)
  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const lockerRoom = computed(() => props.currentLocker)

  const deleteProducts = async () => {
    if (products.value.length) {
      const ok = await confirmDialog({
        title: `Delete ${products.value.length} Product${products.value.length > 1 ? 's' : ''}`,
        description: `Are you sure you want to delete ${products.value.length > 1 ? 'all these products' : 'this product'}? This action cannot be undone.`
      })
      if (ok) {
        lockerRoomStore.deleteProducts(
          products.value.map(prod => prod.id),
          lockerRoom.value!.id
        )
      }
    }
  }
  const deleteLockers = async () => {
    if (lockerRoom.value) {
      const ok = await confirmDialog({
        title: 'Delete Locker?',
        description: 'This action cannot be undone.'
      })
      if (ok) {
        emit('back')
        lockerRoomStore.deleteLocker(lockerRoom.value.id)
      }
    }
  }
</script>
<template>
  <DialogFooter class="w-full">
    <div v-if="props.currentMode === 'list'" class="flex justify-end gap-2 pt-4 border-t w-full">
      <Button variant="ghost">Cancel</Button>
      <Button
        :disabled="selectedLockers.length === 0"
        class="disabled:opacity-25"
        variant="primary"
      >
        <ShoppingBasket class="w-4 h-4" /> Add to cart
      </Button>
    </div>
    <div
      v-else-if="currentMode === 'detail'"
      class="flex pt-4 border-t w-full flex-col md:flex-row gap-2"
    >
      <div class="flex items-center justify-between">
        <span v-if="products.length > 0" class="flex items-center mr-3">
          <AvatarQueue
            :images="products.map(prod => baseStorageUrl + prod.product_front_url)"
            :max="3"
            :class="'overflow-hidden mr-2'"
            :avatar-class="'!rounded-[13px] border p-1 !ring-0 !bg-secondary !shadow-none '"
          />
          <span class="ml-1">{{ products.length }} selected</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  class="p-0"
                  @click="props.lockerProductsRef?.unSelectAllProducts()"
                  ><X class="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="center" side="bottom"> Unselect all products </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </span>
        <Button
          class="mr-3"
          variant="outline"
          @click="props.lockerProductsRef?.selecteAllProducts()"
          >Select all</Button
        >
        <div class="flex items-center gap-1">
          <Button :disabled="products.length === 0" variant="outline">
            <FolderArchive class="size-4" /> Move
          </Button>
          <Button :disabled="products.length !== 1" variant="outline">
            <Copy class="size-4" /> Copy
          </Button>
        </div>
      </div>
      <Separator v-if="!uiStore.isMobile" orientation="vertical" class="h-full mx-5" />

      <div class="flex items-center justify-end">
        <Button variant="outline" class="ml-1" :disabled="selectedProducts.length === 0"
          ><PlusIcon class="size-4" /> Add to collection</Button
        >
        <Button variant="primary" class="ml-1" :disabled="selectedProducts.length === 0">
          <ShoppingBasket class="w-4 h-4" /> Add to cart
        </Button>

        <Separator v-if="!uiStore.isMobile" orientation="vertical" class="h-full mx-5" />
        <Button
          variant="ghost"
          class="text-destructive"
          @click="products.length === 0 ? deleteLockers() : deleteProducts()"
        >
          <TrashIcon class="size-4 text-destructive" /> Delete
        </Button>
      </div>
    </div>
  </DialogFooter>
</template>
