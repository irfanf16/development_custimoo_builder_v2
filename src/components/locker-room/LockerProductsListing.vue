<script setup lang="ts">
  import { Card } from '@/components/ui/card'
  import { DotSeparator } from '@/components/ui/separator'
  import type { LockerProduct } from '@/services/lockers/types'
  import { computed, onMounted, ref, watch } from 'vue'
  import { Checkbox } from '@/components/ui/checkbox'
  import { Spinner } from '@/components/ui/spinner'
  import { TooltipProvider, TooltipContent, TooltipTrigger, Tooltip } from '@/components/ui/tooltip'
  import { Button } from '@/components/ui/button'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { storeToRefs } from 'pinia'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { Copy, Pencil, SwitchCamera, Share2, Download, Loader2Icon, List } from 'lucide-vue-next'
  import CopyProductsDialog from './CopyProductsDialog.vue'
  import { toast } from 'vue-sonner'
  import lockersService from '@/services/lockers/lockers.service'
  import ShareUrlTooltip from '@/components/shared/ShareUrlTooltip.vue'
  import { useFileDownload } from '@/composables/useFileDownload'
  import RosterDialog from '@/components/roster/RosterDialog.vue'
  import {
    locker_no_products,
    msg_product_id_not_found,
    msg_failed_to_generate_share_url,
    msg_failed_to_share_product,
    msg_no_preview_images_to_download
  } from '@/paraglide/messages'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { onImageError } from '@/helpers/imageHelper'

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
  const { isLoading, isDeletingProducts } = storeToRefs(lockerRoomStore)
  const uiStore = useUIStore()
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  const selectedProducts = ref<LockerProduct[]>([])
  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const products_to_copy = ref<LockerProduct[]>([])
  const showBack = ref<Record<number, boolean>>({})
  const productShareUrls = ref<Record<number, string | null>>({})
  const showShareTooltip = ref<Record<number, boolean>>({})
  const downloadingProductId = ref<number | null>(null)

  // ─── Roster dialog state ──────────────────────────────────────────────────────

  const rosterDialogOpen = ref(false)
  const activeRosterProductId = ref<number | null>(null)
  const activeRosterProductName = ref<string>('Roster')

  function openRosterDialog(prod: LockerProduct): void {
    // Set which product's roster we're editing, then open the dialog.
    // RosterDialog's internal watch([open, lockerId]) fires and kicks off fetchRoster().
    activeRosterProductId.value = prod.id
    activeRosterProductName.value = prod.product_name ?? prod.name ?? 'Roster'
    rosterDialogOpen.value = true
  }

  function handleRosterClose(): void {
    rosterDialogOpen.value = false
    // Delay clearing the id slightly so the dialog close animation can finish
    // without the title flickering to 'Roster' mid-animation.
    setTimeout(() => {
      activeRosterProductId.value = null
      activeRosterProductName.value = 'Roster'
    }, 300)
  }

  function handleRosterUpdated(/*payload: { id: number; totalQuantity: number }*/): void {
    // Optionally refresh the product list or update local state after a successful save.
    // For now, just log — replace with a store call or emit when the endpoint is live.
    // console.log('Roster saved for product', payload.id, 'total qty:', payload.totalQuantity)
    return
  }

  // ─── Product grid helpers (unchanged from original) ───────────────────────────

  const { downloadFiles } = useFileDownload()

  const computedProducts = computed(() => props.products)

  function getProductDate(p: LockerProduct, kind: 'created' | 'updated'): number {
    const raw =
      kind === 'created'
        ? ((p as { created_at?: string }).created_at ?? p.product?.created_at)
        : ((p as { updated_at?: string }).updated_at ?? p.product?.updated_at)
    const t = raw ? new Date(raw).getTime() : 0
    return Number.isNaN(t) ? 0 : t
  }

  const filteredProducts = computed(() => {
    const search = props.search?.toLowerCase() || ''
    return [...computedProducts.value]
      .filter(c => c.name.toLowerCase().includes(search))
      .sort((a, b) => {
        switch (props.sort) {
          case 'alphabetical':
            return a.name.localeCompare(b.name)
          case 'createdDate':
            return getProductDate(b, 'created') - getProductDate(a, 'created')
          case 'lastModified':
          default:
            return getProductDate(b, 'updated') - getProductDate(a, 'updated')
        }
      })
  })

  const handleSelect = (id: string | number) => {
    if (isDeletingProducts.value) return
    const existingIndex = selectedProducts.value.findIndex(p => p.id === id)
    if (existingIndex === -1) {
      const prod = props.products.find(p => p.id === id)
      if (prod) selectedProducts.value.push(prod)
    } else {
      selectedProducts.value.splice(existingIndex, 1)
    }
    emit('select-product', [...selectedProducts.value])
  }

  const selecteAllProducts = () => {
    const currentIds = new Set(selectedProducts.value.map(p => p.id))
    props.products.forEach(prod => {
      if (!currentIds.has(prod.id)) selectedProducts.value.push(prod)
    })
    emit('select-product', [...selectedProducts.value])
  }

  const unSelectAllProducts = () => {
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
    const existingShareUrl = prod.shared_url || prod.shared_product?.[0]?.shared_url
    if (existingShareUrl) {
      productShareUrls.value[prod.id] = existingShareUrl
      showShareTooltip.value[prod.id] = true
      return
    }
    try {
      const productId = prod.product_id
      if (!productId) {
        toast.error(msg_product_id_not_found({}, { locale: locale.value }), {
          position: 'top-right',
          richColors: true
        })
        return
      }
      const response = await lockersService.shareProduct(prod.id, productId)
      const shareUrl = response.data?.result?.url || null
      if (shareUrl) {
        productShareUrls.value[prod.id] = shareUrl
        showShareTooltip.value[prod.id] = true
      } else {
        toast.error(msg_failed_to_generate_share_url({}, { locale: locale.value }), {
          position: 'top-right',
          richColors: true
        })
      }
    } catch (error) {
      console.error('Share product error:', error)
      toast.error(msg_failed_to_share_product({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
    }
  }

  function toRelativeUrl(url: string): string {
    if (!url) return ''
    if (url.startsWith('http')) {
      try {
        const urlObj = new URL(url)
        return urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname
      } catch {
        const match = url.match(/\/company_\d+\/.*$/)
        if (match) return match[0].startsWith('/') ? match[0].slice(1) : match[0]
      }
    }
    return url
  }

  async function downloadPreviewImages(prod: LockerProduct) {
    const urls: { url: string; name: string }[] = []
    if (prod.product_front_url) {
      urls.push({
        url: toRelativeUrl(prod.product_front_url),
        name: prod.product_front_url.split('/').pop() || 'front.png'
      })
    }
    if (prod.product_back_url) {
      urls.push({
        url: toRelativeUrl(prod.product_back_url),
        name: prod.product_back_url.split('/').pop() || 'back.png'
      })
    }
    if (urls.length === 0) {
      toast.error(msg_no_preview_images_to_download({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
      return
    }
    downloadingProductId.value = prod.id
    try {
      await downloadFiles(urls)
    } finally {
      downloadingProductId.value = null
    }
  }

  const hasPreviewImages = (prod: LockerProduct) =>
    !!(prod.product_front_url || prod.product_back_url)

  onMounted(() => {
    selectedProducts.value = [...props.preSelectedProducts]
  })

  watch(
    () => props.preSelectedProducts,
    next => {
      selectedProducts.value = [...next]
    },
    { deep: true }
  )

  defineExpose({ selecteAllProducts, unSelectAllProducts })
</script>

<template>
  <Spinner v-if="isLoading" class="size-8 text-primary m-auto mb-4" />
  <div v-else-if="!filteredProducts.length" class="py-8 text-center text-muted-foreground">
    {{ locker_no_products({}, { locale }) }}
  </div>
  <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-6 relative group">
    <Card
      v-for="(prod, prodIndex) in filteredProducts"
      :key="prodIndex"
      class="group rounded-lg cursor-pointer md:py-0 p-0 bg-transparent relative !gap-0 h-fit duration-150 border-0"
    >
      <Checkbox
        :id="`checkbox-addon-${prod.id}`"
        class="absolute top-2 left-2 z-10 size-5 bg-white"
        :class="{
          'top-[calc(0.5rem-1px)] left-[calc(0.5rem-1px)]': isSelected(prod.id)
        }"
        :model-value="isSelected(prod.id)"
        :disabled="isDeletingProducts"
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
          @error="onImageError"
        />

        <div
          class="absolute flex flex-col gap-2 transition-opacity z-20 justify-between h-full p-2 right-0 top-0 accessibilty-menu"
          :class="uiStore.isMobile ? 'opacity-100' : 'opacity-0'"
          @click.stop
        >
          <div class="flex flex-col flex-wrap items-start gap-2 max-h-full">
            <TooltipProvider>
              <Tooltip v-if="!isCreatingCollection">
                <TooltipTrigger as-child>
                  <Button
                    size="icon"
                    variant="secondary"
                    class="h-7 w-7 rounded-full shadow"
                    :disabled="isDeletingProducts"
                    @click="startEditing(prod)"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Edit Product</p></TooltipContent>
              </Tooltip>

              <Tooltip v-if="!isCreatingCollection">
                <TooltipTrigger as-child>
                  <Button
                    size="icon"
                    variant="secondary"
                    class="h-7 w-7 rounded-full shadow"
                    :disabled="isDeletingProducts"
                    @click="copyProduct(prod)"
                  >
                    <Copy class="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Copy Product</p></TooltipContent>
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

              <Tooltip v-if="!isCreatingCollection && hasPreviewImages(prod)">
                <TooltipTrigger as-child>
                  <Button
                    size="icon"
                    variant="secondary"
                    class="h-7 w-7 rounded-full shadow"
                    title="Download Preview Images"
                    :disabled="downloadingProductId === prod.id"
                    @click="downloadPreviewImages(prod)"
                  >
                    <Loader2Icon
                      v-if="downloadingProductId === prod.id"
                      class="w-3.5 h-3.5 animate-spin"
                    />
                    <Download v-else class="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Download Preview Images</p></TooltipContent>
              </Tooltip>

              <!-- Roster button — opens self-contained RosterDialog for this product -->
              <Tooltip v-if="!isCreatingCollection">
                <TooltipTrigger as-child>
                  <Button
                    size="icon"
                    variant="secondary"
                    class="h-7 w-7 rounded-full shadow"
                    :disabled="isDeletingProducts"
                    @click="openRosterDialog(prod)"
                  >
                    <List class="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Edit Roster</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <!-- Metadata -->
      <div class="metadata">
        <div class="mt-2 text-sm font-medium">{{ prod.product_name }}</div>
        <div class="text-xs text-muted-foreground flex gap-1 items-center">
          <span class="flex items-center gap-1">
            {{ prod.product_roster_detail?.reduce((acc, cur) => acc + cur.quantity, 0) || 0 }} pcs
          </span>
          <DotSeparator class="bg-muted-foreground" />
          <span class="flex items-center gap-1">#{{ prod.design_id }}</span>
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

  <!--
    Roster Edit Dialog — self-contained mode.
    Passing `lockerId` (the locker product id) triggers RosterDialog to fetch,
    display, and save the roster entirely internally.
    The parent only needs to handle close and the post-save notification.
  -->
  <RosterDialog
    mode="edit"
    :open="rosterDialogOpen"
    :locker-id="activeRosterProductId"
    :title="activeRosterProductName"
    @update:open="
      val => {
        if (!val) handleRosterClose()
      }
    "
    @roster-updated="handleRosterUpdated"
    @cancel="handleRosterClose"
  />
</template>
