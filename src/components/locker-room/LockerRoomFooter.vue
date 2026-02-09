<script setup lang="ts">
  import { AvatarQueue } from '@/components/ui/avatar-queue'
  import { Button } from '@/components/ui/button'
  import { DialogFooter } from '@/components/ui/dialog'
  import { Separator } from '@/components/ui/separator'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
  import type { Collection, Locker, LockerProduct } from '@/services/lockers/types'
  import { Copy, PlusIcon, ShoppingBasket, TrashIcon, X } from 'lucide-vue-next'
  import { computed, ref } from 'vue'

  import { confirmDialog } from '@/lib/confirm-dialog'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { useCartStore } from '@/stores/cart/cart.store'
  import type LockerProductsListing from './LockerProductsListing.vue'
  import { useUIStore } from '@/stores/ui/ui.store'
  import CopyProductsDialog from '@/components/locker-room/CopyProductsDialog.vue'
  import AddToCollectionDialog from '@/components/locker-room/AddToCollectionDialog.vue'
  import { toast } from 'vue-sonner'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useCompanyStore } from '@/stores/company/company.store'
  import {
    locker_delete_products_title,
    locker_delete_products_description,
    locker_delete_products_title_plural,
    locker_delete_products_description_plural,
    locker_delete_locker_confirm,
    locker_action_cannot_undo,
    locker_delete_collection_confirm,
    locker_cancel_confirm_title,
    locker_cancel_confirm_description,
    locker_cancel,
    locker_add_to_cart,
    locker_add_to_collection,
    locker_selected,
    locker_unselect_all_products,
    locker_select_all,
    locker_copy,
    locker_save,
    locker_cancel_creation,
    locker_delete
  } from '@/paraglide/messages'

  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')
  const companyStore = useCompanyStore()

  type LockerTab = 'products' | 'assets' | 'colours' | 'rosters'

  interface FooterProps {
    currentTab: 'lockers' | 'collections'
    detailsTab: LockerTab
    currentMode: 'list' | 'detail'
    selectedProducts: LockerProduct[]
    selectedLockers: Array<string | number>
    selectedProductsByLocker?: Record<number, number[]>
    lockerProductsRef?: InstanceType<typeof LockerProductsListing> | null
    currentLocker: Locker | null
    currentCollection: Collection | null
    isCreatingCollection: boolean
    collectionCreationStep: number
  }
  const props = withDefaults(defineProps<FooterProps>(), {
    currentTab: 'lockers',
    detailsTab: 'products',
    currentMode: 'list' as 'list' | 'detail',
    selectedProducts: () => [],
    selectedProductsByLocker: () => ({}),
    lockerProductsRef: null,
    isCreatingCollection: false,
    collectionCreationStep: 1
  })

  const emit = defineEmits([
    'back',
    'cancel-collection-creation',
    'create-collection',
    'save-collection',
    'add-to-collection',
    'add-products-to-collection',
    'close'
  ])

  const isEditingCollection = computed(() => {
    // If we have a current collection, we're editing (even if isCreatingCollection is true for adding products flow)
    return props.currentTab === 'collections' && !!props.currentCollection
  })

  const isAddingProductsToCollection = computed(() => {
    // Check if we're in the flow of adding products to an existing collection
    return (
      props.isCreatingCollection && !!props.currentCollection && props.collectionCreationStep === 1
    )
  })
  const uiStore = useUIStore()
  const lockerRoomStore = useLockerRoomStore()
  const cartStore = useCartStore()
  const products = computed(() => props.selectedProducts)
  const showCopyDialog = ref(false)
  const showAddToCollectionDialog = ref(false)
  const isAddingToCart = ref(false)
  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const lockerRoom = computed(() => props.currentLocker)
  const currentCollection = computed(() => props.currentCollection)

  const deleteProducts = async () => {
    if (products.value.length) {
      const isPlural = products.value.length > 1
      const ok = await confirmDialog({
        title: isPlural
          ? locker_delete_products_title_plural(
              { count: products.value.length },
              { locale: locale.value }
            )
          : locker_delete_products_title(
              { count: products.value.length },
              { locale: locale.value }
            ),
        description: isPlural
          ? locker_delete_products_description_plural({}, { locale: locale.value })
          : locker_delete_products_description({}, { locale: locale.value })
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
        title: locker_delete_locker_confirm({}, { locale: locale.value }),
        description: locker_action_cannot_undo({}, { locale: locale.value })
      })
      if (ok) {
        emit('back')
        lockerRoomStore.deleteLocker(lockerRoom.value.id)
      }
    }
  }
  const deleteCollection = async () => {
    if (currentCollection.value) {
      // Don't allow deletion if collection has room_id
      if (currentCollection.value.room_id) {
        return
      }
      const ok = await confirmDialog({
        title: locker_delete_collection_confirm({}, { locale: locale.value }),
        description: locker_action_cannot_undo({}, { locale: locale.value })
      })
      if (ok) {
        emit('back')
        lockerRoomStore.deleteCollection(currentCollection.value.id)
      }
    }
  }

  const canDeleteCollection = computed(() => {
    return currentCollection.value && !currentCollection.value.room_id
  })
  const handleCancel = async () => {
    const ok = await confirmDialog({
      title: locker_cancel_confirm_title({}, { locale: locale.value }),
      description: locker_cancel_confirm_description({}, { locale: locale.value })
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

  const lockerCartPayload = computed(() => {
    const lockers = props.selectedLockers
      .filter(id => !props.selectedProductsByLocker[Number(id)]?.length)
      .map(id => Number(id))
    const locker_products: Record<number, number[]> = {}
    props.selectedLockers
      .filter(id => (props.selectedProductsByLocker[Number(id)]?.length ?? 0) > 0)
      .forEach(id => {
        const numId = Number(id)
        locker_products[numId] = props.selectedProductsByLocker[numId] ?? []
      })
    return { lockers, locker_products }
  })

  const canAddLockerProductsToCart = computed(
    () =>
      lockerCartPayload.value.lockers.length > 0 ||
      Object.keys(lockerCartPayload.value.locker_products).length > 0
  )

  const handleAddLockerProductsToCart = async () => {
    if (!canAddLockerProductsToCart.value) return

    isAddingToCart.value = true
    try {
      await cartStore.addLockerProductsToCart(lockerCartPayload.value)
      const productCount = Object.values(lockerCartPayload.value.locker_products).reduce(
        (sum, ids) => sum + ids.length,
        0
      )
      const total = lockerCartPayload.value.lockers.length + productCount
      toast.success(`Added ${total} item(s) to cart`, {
        position: 'top-right',
        richColors: true
      })
    } catch (error) {
      toast.error('Failed to add products to cart', {
        position: 'top-right',
        richColors: true
      })
      console.error('Add to cart error:', error)
    } finally {
      isAddingToCart.value = false
    }
  }
</script>
<template>
  <DialogFooter class="w-full">
    <div
      v-if="props.currentMode === 'list' && !isCreatingCollection"
      class="flex justify-end gap-2 pt-4 border-t w-full"
    >
      <Button variant="ghost" @click="emit('close')">{{ locker_cancel({}, { locale }) }}</Button>
      <template v-if="!companyStore.isEcommercePlatform">
        <Button
          v-if="!isCreatingCollection"
          :disabled="!canAddLockerProductsToCart"
          class="disabled:opacity-25"
          variant="primary"
          @click="handleAddLockerProductsToCart"
        >
          <ShoppingBasket class="w-4 h-4" /> {{ locker_add_to_cart({}, { locale }) }}
        </Button>

        <Button
          v-else
          :disabled="selectedProducts.length === 0"
          class="disabled:opacity-25"
          variant="primary"
        >
          {{ locker_add_to_collection({}, { locale }) }}
        </Button>
      </template>
    </div>
    <template v-else-if="currentMode === 'detail' || isCreatingCollection">
      <div class="flex pt-4 border-t w-full flex-col md:flex-row gap-2">
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
            <span class="ml-1">{{ products.length }} {{ locker_selected({}, { locale }) }}</span>
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
                <TooltipContent align="center" side="bottom">
                  {{ locker_unselect_all_products({}, { locale }) }}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
          <Button
            v-if="products.length > 0 && collectionCreationStep !== 2"
            class="mr-3"
            variant="outline"
            @click="props.lockerProductsRef?.selecteAllProducts()"
            >{{ locker_select_all({}, { locale }) }}</Button
          >
          <div
            v-if="!isCreatingCollection && currentTab === 'lockers' && detailsTab === 'products'"
            class="flex items-center gap-1"
          >
            <!-- <Button :disabled="products.length === 0" variant="outline">
              <FolderArchive class="size-4" /> {{ locker_move({}, { locale }) }}
            </Button> -->
            <Button
              :disabled="products.length !== 1 && products.length <= 0"
              variant="outline"
              @click="showCopyDialog = true"
            >
              <Copy class="size-4" /> {{ locker_copy({}, { locale }) }}
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
            <PlusIcon class="size-4" />
            {{ isAddingProductsToCollection ? 'Add products' : 'Add to collection' }}</Button
          >
          <Button
            v-if="currentTab === 'collections' && collectionCreationStep === 2"
            variant="primary"
            class="ml-1"
            @click="emit('save-collection')"
          >
            {{ isEditingCollection ? 'Update' : locker_save({}, { locale }) }}</Button
          >
          <Button
            v-if="
              !isCreatingCollection && currentTab === 'lockers' && !companyStore.isEcommercePlatform
            "
            variant="primary"
            class="ml-1"
            :disabled="!canAddLockerProductsToCart"
            @click="handleAddLockerProductsToCart"
          >
            <ShoppingBasket class="w-4 h-4" /> {{ locker_add_to_cart({}, { locale }) }}
          </Button>
          <Button
            v-if="!isCreatingCollection && currentTab === 'lockers' && detailsTab === 'products'"
            variant="outline"
            class="ml-1"
            :disabled="selectedProducts.length === 0"
            @click="showAddToCollectionDialog = true"
          >
            <PlusIcon class="size-4" /> Add to collection
          </Button>
          <Button
            v-if="!isCreatingCollection && currentTab === 'lockers' && detailsTab === 'products'"
            variant="outline"
            class="ml-1"
            :disabled="selectedProducts.length === 0"
            @click="emit('create-collection')"
          >
            <PlusIcon class="size-4" /> Create new collection
          </Button>
          <Button
            v-if="
              currentTab === 'collections' && collectionCreationStep === 2 && !isCreatingCollection
            "
            variant="outline"
            class="ml-1"
            @click="emit('add-products-to-collection')"
          >
            <PlusIcon class="size-4" /> Add to Collection
          </Button>
          <template v-if="!isCreatingCollection">
            <Separator
              v-if="!uiStore.isMobile && currentTab === 'lockers'"
              orientation="vertical"
              class="h-full mx-5"
            />
            <Button
              variant="ghost"
              class="text-destructive"
              :disabled="currentTab === 'collections' && !canDeleteCollection"
              @click="handleDelete"
            >
              <TrashIcon class="size-4 text-destructive" /> {{ locker_delete({}, { locale }) }}
            </Button>
          </template>
          <Button v-else variant="outline" class="text-destructive ml-2" @click="handleCancel">
            {{ locker_cancel_creation({}, { locale }) }}
          </Button>
        </div>
      </div>
    </template>
  </DialogFooter>
  <CopyProductsDialog
    :open="showCopyDialog"
    :locker_products="products"
    @update:open="showCopyDialog = $event"
    @copy-products="payload => lockerRoomStore.copyProducts(payload, currentLocker!.id)"
  />
  <AddToCollectionDialog
    :open="showAddToCollectionDialog"
    @close="showAddToCollectionDialog = false"
    @collection-selected="
      collection => {
        emit('add-to-collection', collection)
        showAddToCollectionDialog = false
      }
    "
  />
</template>
