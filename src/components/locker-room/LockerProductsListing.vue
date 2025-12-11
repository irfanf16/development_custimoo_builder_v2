<script setup lang="ts">
  import { Card } from '@/components/ui/card'
  import { DotSeparator } from '@/components/ui/separator'
  import type { LockerProduct } from '@/services/lockers/types'
  import { computed, ref } from 'vue'
  import { Checkbox } from '@/components/ui/checkbox'
  import { Spinner } from '@/components/ui/spinner'
  import { TooltipProvider, TooltipContent, TooltipTrigger, Tooltip } from '@/components/ui/tooltip'
  import { Button } from '@/components/ui/button'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { storeToRefs } from 'pinia'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { Copy, Pencil, SwitchCamera } from 'lucide-vue-next'
  import CopyProductsDialog from './CopyProductsDialog.vue'

  const props = defineProps<{ products: LockerProduct[]; lockerId: number }>()
  const emit = defineEmits(['select-product'])

  const showCopyDialog = ref<boolean>(false)
  const lockerRoomStore = useLockerRoomStore()
  const { isLoading } = storeToRefs(lockerRoomStore)
  const uiStore = useUIStore()

  const selectedProduct = ref<(string | number)[]>([])
  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const products_to_copy = ref<LockerProduct[]>([])
  const showBack = ref<Record<number, boolean>>({})

  const handleSelect = (id: string | number) => {
    if (!selectedProduct.value.includes(id)) {
      selectedProduct.value.push(id)
    } else {
      selectedProduct.value = selectedProduct.value.filter(i => i !== id)
    }
    const locker_products = selectedProduct.value.map(id =>
      props.products.find(prod => prod.id === id)
    )
    emit('select-product', locker_products)
  }
  const selecteAllProducts = () => {
    selectedProduct.value = props.products.map(prod => prod.id)

    const locker_products = selectedProduct.value.map(id =>
      props.products.find(prod => prod.id === id)
    )
    emit('select-product', locker_products)
  }

  const unSelectAllProducts = () => {
    selectedProduct.value = []

    emit('select-product', [])
  }

  const startEditing = (prod: LockerProduct, prodIndex: number) => {
    console.log(`prodIndex => ${prodIndex}`, prod)
  }

  const copyProduct = (prod: LockerProduct) => {
    showCopyDialog.value = true
    products_to_copy.value?.push(prod)
  }

  const toggleImage = (prodId: number) => {
    showBack.value[prodId] = !showBack.value[prodId]
  }
  defineExpose({ selecteAllProducts, unSelectAllProducts })
</script>
<template>
  <Spinner v-if="isLoading" class="size-8 text-primary m-auto mb-4" />
  <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-6 relative group">
    <Card
      v-for="(prod, prodIndex) in products"
      :key="prodIndex"
      class="group rounded-lg cursor-pointer md:py-0 p-0 bg-transparent relative !gap-0 h-fit duration-150 border-0"
    >
      <!-- Hover Toolbar -->

      <Checkbox
        :id="`checkbox-addon-${prod.id}`"
        class="absolute top-2 left-2 z-10 size-5 bg-white"
        :class="{
          'top-[calc(0.5rem-1px)] left-[calc(0.5rem-1px)]': selectedProduct.includes(prod.id)
        }"
        :model-value="selectedProduct.includes(prod.id)"
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
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    size="icon"
                    variant="secondary"
                    class="h-7 w-7 rounded-full shadow"
                    @click="startEditing(prod, prodIndex)"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Product</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
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
