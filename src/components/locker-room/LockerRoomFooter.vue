<script setup lang="ts">
  import { AvatarQueue } from '@/components/ui/avatar-queue'
  import { Button } from '@/components/ui/button'
  import { DialogFooter } from '@/components/ui/dialog'
  import { Separator } from '@/components/ui/separator'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
  import type { Collection, Locker, LockerProduct } from '@/services/lockers/types'
  import { Copy, FolderArchive, PlusIcon, ShoppingBasket, TrashIcon, X } from 'lucide-vue-next'
  import { computed, ref } from 'vue'

  import { confirmDialog } from '@/lib/confirm-dialog'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import type LockerProductsListing from './LockerProductsListing.vue'
  import { useUIStore } from '@/stores/ui/ui.store'
  import CopyProductsDialog from '@/components/locker-room/CopyProductsDialog.vue'

  type LockerTab = 'products' | 'assets' | 'colours' | 'rosters'

  interface FooterProps {
    currentTab: 'lockers' | 'collections'
    detailsTab: LockerTab
    currentMode: 'list' | 'detail'
    selectedProducts: LockerProduct[]
    selectedLockers: Array<string | number>
    lockerProductsRef?: InstanceType<typeof LockerProductsListing> | null
    currentLocker: Locker | null
    currentCollection: Collection | null
    isCreatingCollection: boolean
    collectionCreationStep: number
  }
  const props = withDefaults(defineProps<FooterProps>(), {
    currentTab: 'lockers',
    detailsTab: 'products',
    currentMode: 'list',
    selectedProducts: () => [],
    lockerProductsRef: null,
    isCreatingCollection: false,
    collectionCreationStep: 1
  })

  const emit = defineEmits([
    'back',
    'cancel-collection-creation',
    'create-collection',
    'save-collection'
  ])
  const uiStore = useUIStore()
  const lockerRoomStore = useLockerRoomStore()
  const products = computed(() => props.selectedProducts)
  const showCopyDialog = ref(false)
  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const lockerRoom = computed(() => props.currentLocker)
  const currentCollection = computed(() => props.currentCollection)

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
  const deleteCollection = async () => {
    if (currentCollection.value) {
      const ok = await confirmDialog({
        title: 'Delete Collection?',
        description: 'This action cannot be undone.'
      })
      if (ok) {
        emit('back')
        lockerRoomStore.deleteCollection(currentCollection.value.id)
      }
    }
  }
  const handleCancel = async () => {
    const ok = await confirmDialog({
      title: 'Are you sure you want to cancel?',
      description: "By confirming you'll lose access to all the progress made so far."
    })
    if (ok) {
      emit('cancel-collection-creation')
    }
  }

  const handleDelete = () => {
    if (
      props.currentTab === 'lockers' &&
      props.detailsTab === 'products' &&
      props.selectedProducts.length
    )
      deleteProducts()
    else if (props.currentTab === 'lockers') deleteLockers()
    else if (props.currentTab === 'collections') deleteCollection()
    else return
  }
</script>
<template>
  <DialogFooter class="w-full">
    <div
      v-if="props.currentMode === 'list' && !isCreatingCollection"
      class="flex justify-end gap-2 pt-4 border-t w-full"
    >
      <Button variant="ghost">Cancel</Button>
      <Button
        v-if="!isCreatingCollection"
        :disabled="selectedLockers.length === 0"
        class="disabled:opacity-25"
        variant="primary"
      >
        <ShoppingBasket class="w-4 h-4" /> Add to cart
      </Button>

      <Button
        v-else
        :disabled="selectedProducts.length === 0"
        class="disabled:opacity-25"
        variant="primary"
      >
        Add to Collection
      </Button>
    </div>
    <div
      v-else-if="currentMode === 'detail' || isCreatingCollection"
      class="flex pt-4 border-t w-full flex-col md:flex-row gap-2"
    >
      <div
        class="flex items-center justify-between"
        :class="{
          'w-full': isCreatingCollection,
          'justify-end!': !isCreatingCollection && collectionCreationStep === 2
        }"
      >
        <span
          v-if="products.length > 0 && collectionCreationStep !== 2"
          class="flex items-center mr-3"
        >
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
          v-if="products.length > 0 && collectionCreationStep !== 2"
          class="mr-3"
          variant="outline"
          @click="props.lockerProductsRef?.selecteAllProducts()"
          >Select all</Button
        >
        <div
          v-if="!isCreatingCollection && currentTab === 'lockers' && detailsTab === 'products'"
          class="flex items-center gap-1"
        >
          <Button :disabled="products.length === 0" variant="outline">
            <FolderArchive class="size-4" /> Move
          </Button>
          <Button
            :disabled="products.length !== 1 && products.length <= 0"
            variant="outline"
            @click="showCopyDialog = true"
          >
            <Copy class="size-4" /> Copy
          </Button>
        </div>
      </div>
      <Separator
        v-if="!uiStore.isMobile && !isCreatingCollection && currentTab === 'lockers'"
        orientation="vertical"
        class="h-full mx-5"
      />

      <div
        class="flex items-center justify-end"
        :class="{
          'w-full': collectionCreationStep === 2 && currentTab === 'collections'
        }"
      >
        <Button
          v-if="
            isCreatingCollection &&
            collectionCreationStep === 1 &&
            currentTab === 'lockers' &&
            detailsTab === 'products'
          "
          variant="outline"
          class="ml-1"
          :disabled="selectedProducts.length === 0"
          @click="emit('create-collection')"
        >
          <PlusIcon class="size-4" /> Add to collection</Button
        >
        <Button
          v-if="currentTab === 'collections' && collectionCreationStep === 2"
          variant="primary"
          class="ml-1"
          @click="emit('save-collection')"
        >
          Save</Button
        >
        <Button
          v-if="!isCreatingCollection && currentTab === 'lockers'"
          variant="primary"
          class="ml-1"
          :disabled="selectedProducts.length === 0"
        >
          <ShoppingBasket class="w-4 h-4" /> Add to cart
        </Button>
        <template v-if="!isCreatingCollection">
          <Separator
            v-if="!uiStore.isMobile && currentTab === 'lockers'"
            orientation="vertical"
            class="h-full mx-5"
          />
          <Button variant="ghost" class="text-destructive" @click="handleDelete">
            <TrashIcon class="size-4 text-destructive" /> Delete
          </Button>
        </template>
        <Button v-else variant="outline" class="text-destructive ml-2" @click="handleCancel">
          Cancel Creation
        </Button>
      </div>
    </div>
  </DialogFooter>
  <CopyProductsDialog
    :open="showCopyDialog"
    :locker_products="products"
    @update:open="showCopyDialog = $event"
    @copy-products="payload => lockerRoomStore.copyProducts(payload, currentLocker!.id)"
  />
</template>
