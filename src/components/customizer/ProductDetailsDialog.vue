<script setup lang="ts">
  import Dialog from '@/components/ui/dialog/Dialog.vue'
  import DialogContent from '@/components/ui/dialog/DialogContent.vue'
  import { DialogTitle } from '@/components/ui/dialog'
  import { products_product_details } from '@/paraglide/messages'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import Spinner from '../ui/spinner/Spinner.vue'
  import { useProductsStore } from '@/stores/products/products.store'

  const profileStore = useProfileStore()
  const productsStore = useProductsStore()
  // const { isLoading } = storeToRefs(productsStore)
  // const { currentLocale } = storeToRefs(profileStore)

  const props = defineProps<{ open: boolean }>()
  const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
  }>()
</script>

<template>
  <Dialog :open="props.open" variant="large" @update:open="emit('update:open', $event)">
    <DialogContent variant="large">
      <DialogHeader>
        <DialogTitle>{{
          products_product_details({}, { locale: profileStore.currentLocale })
        }}</DialogTitle>
      </DialogHeader>
      <div
        v-if="profileStore.isLoading"
        class="absolute inset-0 flex items-center justify-center z-50"
      >
        <Spinner class="text-primary size-6" />
      </div>
      <div>
        <p>
          {{ productsStore.activeProductDetails?.sku?.description }}
        </p>
      </div>
    </DialogContent>
  </Dialog>
</template>
