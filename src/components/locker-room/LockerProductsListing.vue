<script setup lang="ts">
  import { Card } from '@/components/ui/card'
  import { DotSeparator } from '@/components/ui/separator'
  import type { LockerProduct } from '@/services/lockers/types'
  import { computed, onMounted, ref } from 'vue'
  import { Checkbox } from '@/components/ui/checkbox'
  import { Spinner } from '@/components/ui/spinner'
  import { TooltipProvider, TooltipContent, TooltipTrigger, Tooltip } from '@/components/ui/tooltip'
  import { Button } from '@/components/ui/button'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { storeToRefs } from 'pinia'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { Copy, Pencil, SwitchCamera, Share2 } from 'lucide-vue-next'
  import CopyProductsDialog from './CopyProductsDialog.vue'
  import { toast } from 'vue-sonner'
  import lockersService from '@/services/lockers/lockers.service'
  import ShareUrlTooltip from '@/components/shared/ShareUrlTooltip.vue'
  type SortOption = 'lastModified' | 'alphabetical' | 'createdDate'

  const props = withDefaults(
    defineProps<{
      products: LockerProduct[]
      lockerId: number
      preSelectedProducts: LockerProduct[]
      isCreatingCollection: boolean
      sort: SortOption
      search: string | null
    }>(),
    {
      sort: 'lastModified'
    }
  )
  type EditLockerProductPayload = {
    lockerProductId: number
    lockerId: number
    lockerProduct: LockerProduct
  }
  const emit = defineEmits<{
    (e: 'select-product', products: LockerProduct[]): void
    (e: 'edit-product', payload: EditLockerProductPayload): void
  }>()

  const showCopyDialog = ref<boolean>(false)
  const lockerRoomStore = useLockerRoomStore()
  const { isLoading } = storeToRefs(lockerRoomStore)
  const uiStore = useUIStore()

  const selectedProducts = ref<LockerProduct[]>([])
  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const products_to_copy = ref<LockerProduct[]>([])
  const showBack = ref<Record<number, boolean>>({})
  const productShareUrls = ref<Record<number, string | null>>({})
  const showShareTooltip = ref<Record<number, boolean>>({})

  const computedProducts = computed(() => props.products)
  const filteredProducts = computed(() => {
    const search = props.search?.toLowerCase() || ''

    return [...computedProducts.value]
      .filter(c => c.name.toLowerCase().includes(search))
      .sort((a, b) => {
        switch (props.sort) {
          case 'alphabetical':
            return a.name.localeCompare(b.name)

          case 'createdDate':
            return (
              new Date(b.product?.created_at).getTime() - new Date(a.product?.created_at).getTime()
            )

          case 'lastModified':
          default:
            return (
              new Date(b.product?.updated_at).getTime() - new Date(a.product?.updated_at).getTime()
            )
        }
      })
  })
  const handleSelect = (id: string | number) => {
    const existingIndex = selectedProducts.value.findIndex(p => p.id === id)

    if (existingIndex === -1) {
      // selecting → find product ONLY from current list
      const prod = props.products.find(p => p.id === id)
      if (prod) {
        selectedProducts.value.push(prod)
      }
    } else {
      // unselecting → remove only that product
      selectedProducts.value.splice(existingIndex, 1)
    }

    emit('select-product', [...selectedProducts.value])
  }
  const selecteAllProducts = () => {
    const currentIds = new Set(selectedProducts.value.map(p => p.id))

    props.products.forEach(prod => {
      if (!currentIds.has(prod.id)) {
        selectedProducts.value.push(prod)
      }
    })

    emit('select-product', [...selectedProducts.value])
  }

  const unSelectAllProducts = () => {
    // remove only products from current list
    const currentIds = new Set(props.products.map(p => p.id))

    selectedProducts.value = selectedProducts.value.filter(p => !currentIds.has(p.id))

    emit('select-product', [...selectedProducts.value])
  }

  const startEditing = (prod: LockerProduct) => {
    emit('edit-product', {
      lockerProductId: prod.id,
      lockerId: props.lockerId,
      lockerProduct: prod
    })
  }

  const copyProduct = (prod: LockerProduct) => {
    showCopyDialog.value = true
    products_to_copy.value?.push(prod)
  }

  const toggleImage = (prodId: number) => {
    showBack.value[prodId] = !showBack.value[prodId]
  }
  const isSelected = (id: number | string) => selectedProducts.value.some(p => p.id === id)

  const shareProduct = async (prod: LockerProduct) => {
    // Check if product already has a share URL
    const existingShareUrl = prod.shared_url || prod.shared_product?.[0]?.shared_url

    if (existingShareUrl) {
      // Use existing share URL
      productShareUrls.value[prod.id] = existingShareUrl
      showShareTooltip.value[prod.id] = true
      return
    }

    // Generate new share URL
    try {
      const productId = prod.product_id
      if (!productId) {
        toast.error('Product ID not found', {
          position: 'top-right',
          richColors: true
        })
        return
      }

      const response = await lockersService.shareProduct(prod.id, productId)

      // Extract share URL from response: result.url
      const shareUrl = response.data?.result?.url || null

      if (shareUrl) {
        productShareUrls.value[prod.id] = shareUrl
        showShareTooltip.value[prod.id] = true
      } else {
        toast.error('Failed to generate share URL', {
          position: 'top-right',
          richColors: true
        })
      }
    } catch (error) {
      console.error('Share product error:', error)
      toast.error('Failed to share product', {
        position: 'top-right',
        richColors: true
      })
    }
  }
  onMounted(() => {
    selectedProducts.value = [...props.preSelectedProducts]
  })

  defineExpose({ selecteAllProducts, unSelectAllProducts })
</script>
<template>
  <Spinner v-if="isLoading" class="size-8 text-primary m-auto mb-4" />
  <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-6 relative group">
    <Card
      v-for="(prod, prodIndex) in filteredProducts"
      :key="prodIndex"
      class="group rounded-lg cursor-pointer md:py-0 p-0 bg-transparent relative !gap-0 h-fit duration-150 border-0"
    >
      <!-- Hover Toolbar -->

      <Checkbox
        :id="`checkbox-addon-${prod.id}`"
        class="absolute top-2 left-2 z-10 size-5 bg-white"
        :class="{
          'top-[calc(0.5rem-1px)] left-[calc(0.5rem-1px)]': isSelected(prod.id)
        }"
        :model-value="isSelected(prod.id)"
        @update:model-value="handleSelect(prod.id)"
        @click.stop
      />

      <!-- Thumbnail -->
      <div
        class="bg-secondary rounded-md aspect-video md:aspect-[4/3] overflow-hidden gap-1 p-[20px] border relative place-items-center product-card"
        @click="handleSelect(prod.id)"
      >
        <img
          :src="
            baseStorageUrl + (showBack[prod.id] ? prod.product_back_url : prod.product_front_url)
          "
          class="h-full overflow-hidden object-contain rounded-md mx-auto w-full"
        />

        <div
          class="absolute flex flex-col gap-2 transition-opacity z-20 justify-between h-full p-2 right-0 top-0 accessibilty-menu"
          :class="uiStore.isMobile ? 'opacity-100' : 'opacity-0'"
          @click.stop
        >
          <div class="flex items-center gap-2 flex-col">
            <TooltipProvider>
              <Tooltip v-if="!isCreatingCollection">
                <TooltipTrigger as-child>
                  <Button
                    size="icon"
                    variant="secondary"
                    class="h-7 w-7 rounded-full shadow"
                    @click="startEditing(prod)"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Product</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip v-if="!isCreatingCollection">
                <TooltipTrigger as-child>
                  <Button
                    size="icon"
                    variant="secondary"
                    class="h-7 w-7 rounded-full shadow"
                    @click="copyProduct(prod)"
                  >
                    <Copy class="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy Product</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    size="icon"
                    variant="secondary"
                    class="h-7 w-7 rounded-full shadow"
                    @click="toggleImage(prod.id)"
                  >
                    <SwitchCamera class="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle {{ showBack[prod.id] ? 'Front' : 'Back' }} image</p>
                </TooltipContent>
              </Tooltip>
              <ShareUrlTooltip
                v-if="!isCreatingCollection"
                :share-url="
                  productShareUrls[prod.id] ||
                  prod.shared_url ||
                  prod.shared_product?.[0]?.shared_url ||
                  null
                "
                :open="showShareTooltip[prod.id] || false"
                @update:open="showShareTooltip[prod.id] = $event"
              >
                <Button
                  size="icon"
                  variant="secondary"
                  class="h-7 w-7 rounded-full shadow"
                  title="Share Product"
                  @click="shareProduct(prod)"
                >
                  <Share2 class="w-3.5 h-3.5" />
                </Button>
              </ShareUrlTooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <!-- Metadata -->
      <div class="metadata">
        <div class="mt-2 text-sm font-medium">{{ prod.product_name }}</div>
        <div class="text-xs text-muted-foreground flex gap-1 items-center">
          <span class="flex items-center gap-1">
            {{ prod.product_roster_detail?.reduce((acc, cur) => acc + cur.quantity, 0) || 0 }}
            pcs</span
          >
          <DotSeparator class="bg-muted-foreground" />
          <span class="flex items-center gap-1"> #{{ prod.design_id }} </span>
        </div>
      </div>
    </Card>
  </div>

  <CopyProductsDialog
    :open="showCopyDialog"
    :locker_products="products_to_copy"
    @update:open="
      open => {
        showCopyDialog = open
        products_to_copy = []
      }
    "
    @copy-products="payload => lockerRoomStore.copyProducts(payload, lockerId)"
  />
</template>
<!-- <style>
  .product-card:hover .accessibilty-menu {
    opacity: 1 !important;
  }
</style> -->
