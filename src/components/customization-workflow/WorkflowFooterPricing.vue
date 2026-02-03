<script setup lang="ts">
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useCartStore } from '@/stores/cart/cart.store'
  import { useBuildFactoryProduct } from '@/composables/useBuildFactoryProduct'
  import { Button } from '@/components/ui/button'
  import { ShoppingCart } from 'lucide-vue-next'
  import { toast } from 'vue-sonner'
  import { summary_mrsp, summary_for, summary_pcs, price_add_to_cart } from '@/paraglide/messages'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { usePricing } from '@/composables/usePricing'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { useCompanyStore } from '@/stores/company/company.store'
  const uiStore = useUIStore()
  // Stores
  const profileStore = useProfileStore()
  const cartStore = useCartStore()
  const authStore = useAuthStore()
  const companyStore = useCompanyStore()
  const { activeProductPrice, minimumActiveProductQuantityByDesign, showPricing } = usePricing()
  const { buildFactoryProductPayload } = useBuildFactoryProduct()

  // const estimatedDeliveryDate = computed(() => {
  //   // This would come from API, using placeholder for now
  //   return 'March 25-27, 2025'
  // })

  defineProps<{
    isExpanded?: boolean
  }>()

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
  <div class="space-y-2 md:space-y-4" :class="{ 'w-auto': isExpanded, 'w-full': !isExpanded }">
    <div class="space-y-1">
      <p
        v-if="showPricing && !uiStore.isMobile"
        class="text-xs text-muted-foreground uppercase tracking-wide"
      >
        {{ summary_mrsp({}, { locale: profileStore.currentLocale }) }}
      </p>
      <div v-if="showPricing" class="flex items-baseline gap-1 md:gap-2">
        <p v-if="uiStore.isMobile" class="text-xs text-muted-foreground uppercase tracking-wide">
          {{ summary_mrsp({}, { locale: profileStore.currentLocale }) }}
        </p>
        <p class="text-lg md:text-2xl font-bold text-foreground">
          {{ activeProductPrice }}
        </p>
        <p class="text-sm text-muted-foreground">
          {{ summary_for({}, { locale: profileStore.currentLocale }) }}
          {{ minimumActiveProductQuantityByDesign }}
          {{ summary_pcs({}, { locale: profileStore.currentLocale }) }}
        </p>
      </div>
      <!-- <p class="text-xs text-muted-foreground">
        {{ estimated_shipping_date({}, { locale }) }} {{ estimatedDeliveryDate }}
      </p> -->
    </div>
    <Button
      v-if="!(companyStore.isEcommercePlatform && authStore.hasAdminToken)"
      variant="primary"
      :size="uiStore.isMobile ? 'sm' : 'lg'"
      class="w-full"
      @click="handleAddToCart"
    >
      <ShoppingCart class="size-4" />
      {{ price_add_to_cart({}, { locale: profileStore.currentLocale }) }}
    </Button>
  </div>
</template>
