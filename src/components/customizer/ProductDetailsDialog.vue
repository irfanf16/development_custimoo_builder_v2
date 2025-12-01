<script setup lang="ts">
  import Dialog from '@/components/ui/dialog/Dialog.vue'
  import DialogContent from '@/components/ui/dialog/DialogContent.vue'
  import { DialogTitle } from '@/components/ui/dialog'
  import { products_product_details } from '@/paraglide/messages'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import Spinner from '../ui/spinner/Spinner.vue'
  import { useProductsStore } from '@/stores/products/products.store'
  import type {
    ActiveProductDetails,
    OutputDesignPreviewFront,
    OutputDesignPreviewBack
  } from '@/services/products/types'
  import { ref, watch } from 'vue'

  const profileStore = useProfileStore()
  const productsStore = useProductsStore()
  const { isLoading, fetchProductDetailsAndDesignsForProductPreview } = productsStore

  const productPreviewDetails = ref<{
    productDetails: ActiveProductDetails
    designDetails: (OutputDesignPreviewFront & OutputDesignPreviewBack)[]
  } | null>(null)
  // const { currentLocale } = storeToRefs(profileStore)

  const props = defineProps<{ open: boolean; productId: number }>()
  const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
  }>()

  // on props open = true, fetch the product details and design previews
  watch(
    () => props.open,
    async (newVal: boolean) => {
      if (newVal) {
        productPreviewDetails.value = await fetchProductDetailsAndDesignsForProductPreview(
          props.productId
        )
      }
    }
  )
</script>

<template>
  <Dialog :open="props.open" variant="large" @update:open="emit('update:open', $event)">
    <DialogContent variant="large">
      <DialogHeader>
        <DialogTitle>{{
          products_product_details({}, { locale: profileStore.currentLocale })
        }}</DialogTitle>
      </DialogHeader>
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center z-50">
        <Spinner class="text-primary size-6" />
      </div>
      <div>
        <p>
          {{
            productPreviewDetails?.productDetails?.productDetails?.sku?.description ??
            'No description'
          }}
        </p>
      </div>
    </DialogContent>
  </Dialog>
</template>
