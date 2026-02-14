<script setup lang="ts">
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
    price_add_to_cart,
    minimum_quantity
  } from '@/paraglide/messages'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { usePricing } from '@/composables/usePricing'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { useCompanyStore } from '@/stores/company/company.store'
  import { useSignIn } from '@/composables/useSignIn'
  import { usePendingPostLoginAction } from '@/composables/usePendingPostLoginAction'
  import { useRoster } from '@/components/customization-workflow/WorkflowSteps/roster/useRoster'
  import { useCustomizerMenu } from '@/composables/useCustomizerMenu'
  import { storeToRefs } from 'pinia'
  import { computed } from 'vue'

  const uiStore = useUIStore()
  const profileStore = useProfileStore()
  const cartStore = useCartStore()
  const authStore = useAuthStore()
  const companyStore = useCompanyStore()
  const {
    activeProductPrice,
    showPricing,
    minimumActiveProductQuantityByDesignToCard,
    isQuantityByDesign
  } = usePricing()
  const { totalRosterQuantity } = useRoster()
  const { buildFactoryProductPayload } = useBuildFactoryProduct()
  const { openSignInDialog } = useSignIn()
  const { setPending } = usePendingPostLoginAction()
  const { rosterEntries, ensureEditableRoster } = useRoster()
  const { menuItems, goTo } = useCustomizerMenu()

  const { isAuthenticated: isLoggedIn } = storeToRefs(authStore)
  const isEditingCartProduct = computed(() => cartStore.isEditingCartProduct)

  defineProps<{
    isExpanded?: boolean
  }>()

  async function handleUpdateCartProduct() {
    if (!cartStore.editingCartItemId || !cartStore.editingFactoryProductId) {
      toast.error('No cart product selected for update', {
        position: 'top-right',
        richColors: true
      })
      return
    }
    try {
      const rosterQty = totalRosterQuantity.value
      const minDesignQty = minimumActiveProductQuantityByDesignToCard.value
      const isByDesign = isQuantityByDesign.value

      if (rosterQty <= 0) {
        toast.error('Please add at least one item to the roster before adding to cart.', {
          position: 'top-right',
          richColors: true
        })
        return
      }

      if (isByDesign && rosterQty < minDesignQty) {
        toast.error(
          `Please add at least ${minDesignQty} items to the roster before adding to cart.`,
          {
            position: 'top-right',
            richColors: true
          }
        )
        return
      }

      const { factory_product, product_assets } = await buildFactoryProductPayload()
      const result = await cartStore.updateCartItem(cartStore.editingCartItemId, {
        factory_product,
        product_assets
      })
      if (result && !result.errors.length) {
        cartStore.clearEditingCartProduct()
        toast.success('Cart updated', { position: 'top-right', richColors: true })
      }
    } catch (error) {
      toast.error('Failed to update cart', { position: 'top-right', richColors: true })
      console.error('Update cart error:', error)
    }
  }

  async function handleAddToCart() {
    const totalQuantity = rosterEntries.value.reduce((sum, entry) => sum + (entry.quantity || 0), 0)
    if (totalQuantity === 0) {
      toast.error('Please add roster entries with quantities before adding to cart', {
        position: 'top-right',
        richColors: true
      })
      const visibleSteps = menuItems.value.map(i => i.step)
      if (visibleSteps.includes('roster')) {
        await goTo('roster')
        await ensureEditableRoster()
      }
      return
    }
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

  async function handleButtonClick() {
    if (!isLoggedIn.value) {
      setPending(isEditingCartProduct.value ? 'updateCart' : 'addToCart')
      openSignInDialog()
      return
    }
    if (isEditingCartProduct.value) {
      await handleUpdateCartProduct()
    } else {
      await handleAddToCart()
    }
  }

  const buttonLabel = computed(() =>
    isEditingCartProduct.value
      ? 'Update'
      : price_add_to_cart({}, { locale: profileStore.currentLocale })
  )
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
          {{ totalRosterQuantity }}
          {{ summary_pcs({}, { locale: profileStore.currentLocale }) }}
        </p>
      </div>
      <p
        class="text-xs"
        :class="
          totalRosterQuantity < minimumActiveProductQuantityByDesignToCard
            ? 'text-red-500'
            : 'text-green-500'
        "
      >
        {{ minimum_quantity({}, { locale: profileStore.currentLocale }) }}:&nbsp;
        {{ minimumActiveProductQuantityByDesignToCard }}
      </p>

      <!-- <p class="text-xs text-muted-foreground">
        {{ estimated_shipping_date({}, { locale }) }} {{ estimatedDeliveryDate }}
      </p> -->
    </div>
    <Button
      v-if="isLoggedIn && !(companyStore.isEcommercePlatform && authStore.hasAdminToken)"
      variant="primary"
      :size="uiStore.isMobile ? 'sm' : 'lg'"
      class="w-full"
      :disabled="
        totalRosterQuantity <= 0 ||
        (isQuantityByDesign && totalRosterQuantity < minimumActiveProductQuantityByDesignToCard) ||
        !authStore.isAuthenticated
      "
      @click="handleButtonClick"
      @click.once="handleAddToCart"
    >
      <ShoppingCart class="size-4" />
      {{ buttonLabel }}
    </Button>
  </div>
</template>
