<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useCartStore } from '@/stores/cart/cart.store'
  import { useBuildFactoryProduct } from '@/composables/useBuildFactoryProduct'
  import { Button } from '@/components/ui/button'
  import { ShoppingCart } from 'lucide-vue-next'
  import { toast } from 'vue-sonner'
  import {
    summary_mrsp,
    summary_for,
    summary_pcs,
    estimated_shipping_date,
    price_add_to_cart
  } from '@/paraglide/messages'
  import { useUIStore } from '@/stores/ui/ui.store'
  const uiStore = useUIStore()
  // Stores
  const productsStore = useProductsStore()
  const profileStore = useProfileStore()
  const cartStore = useCartStore()
  const { buildFactoryProductPayload } = useBuildFactoryProduct()

  const { activeProductDetails } = storeToRefs(productsStore)

  const locale = computed(() => profileStore.currentLocale || 'en')

  // Pricing
  const formattedPrice = computed(() => {
    const price = activeProductDetails.value?.sku?.customized_sku_info
    if (typeof price === 'number' && !Number.isNaN(price)) {
      return new Intl.NumberFormat(locale.value, {
        style: 'currency',
        currency: 'USD'
      }).format(price)
    }
    return null
  })

  const quantityText = computed(() => {
    const flexibleQuantity = activeProductDetails.value?.allowed_logos_count
    if (typeof flexibleQuantity === 'number' && flexibleQuantity > 0) {
      return flexibleQuantity
    }
    return 10
  })

  const estimatedDeliveryDate = computed(() => {
    // This would come from API, using placeholder for now
    return 'March 25-27, 2025'
  })

  // Add to cart
  async function handleAddToCart() {
    try {
      const { factory_product, product_assets } = await buildFactoryProductPayload()

      await cartStore.addProductToCart({
        factory_product,
        product_assets
      })

      toast.success('Product added to cart', {
        position: 'top-right',
        richColors: true
      })
    } catch (error) {
      toast.error('Failed to add product to cart', {
        position: 'top-right',
        richColors: true
      })
      console.error('Add to cart error:', error)
    }
  }
</script>

<template>
  <div class="w-full space-y-2 md:space-y-4">
    <div class="space-y-1">
      <p v-if="!uiStore.isMobile" class="text-xs text-muted-foreground uppercase tracking-wide">
        {{ summary_mrsp({}, { locale }) }}
      </p>
      <div class="flex items-baseline gap-1 md:gap-2">
        <p v-if="uiStore.isMobile" class="text-xs text-muted-foreground uppercase tracking-wide">
          {{ summary_mrsp({}, { locale }) }}
        </p>
        <p class="text-lg md:text-2xl font-bold text-foreground">
          {{ formattedPrice || '$56.99' }}
        </p>
        <p class="text-sm text-muted-foreground">
          {{ summary_for({}, { locale }) }} {{ quantityText }}
          {{ summary_pcs({}, { locale }) }}
        </p>
      </div>
      <p class="text-xs text-muted-foreground">
        {{ estimated_shipping_date({}, { locale }) }} {{ estimatedDeliveryDate }}
      </p>
    </div>
    <Button
      variant="primary"
      :size="uiStore.isMobile ? 'sm' : 'lg'"
      class="w-full"
      @click="handleAddToCart"
    >
      <ShoppingCart class="size-4" />
      {{ price_add_to_cart({}, { locale }) }}
    </Button>
  </div>
</template>
