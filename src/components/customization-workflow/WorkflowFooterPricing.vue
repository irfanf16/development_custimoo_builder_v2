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
    minimum_quantity,
    msg_no_cart_product_selected,
    msg_add_roster_before_cart,
    msg_add_roster_entries_quantities,
    msg_cart_updated,
    msg_failed_to_update_cart,
    msg_failed_to_add_to_cart
  } from '@/paraglide/messages'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { usePricing } from '@/composables/usePricing'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { useSignIn } from '@/composables/useSignIn'
  import { usePendingPostLoginAction } from '@/composables/usePendingPostLoginAction'
  import { useRoster } from '@/components/customization-workflow/WorkflowSteps/roster/useRoster'
  import { useCustomizerMenu } from '@/composables/useCustomizerMenu'
  import { useAddToCartVisibility } from '@/composables/useAddToCartVisibility'
  import { usePermissions } from '@/composables/usePermissions'
  import { storeToRefs } from 'pinia'
  import { computed } from 'vue'

  const uiStore = useUIStore()
  const { can } = usePermissions()
  const profileStore = useProfileStore()
  const cartStore = useCartStore()
  const authStore = useAuthStore()
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
  const { shouldShowAddToCartButton } = useAddToCartVisibility()

  const { isAuthenticated: isLoggedIn } = storeToRefs(authStore)
  const canSkipMoq = computed(() => can('skip-moq'))
  const isEditingCartProduct = computed(() => cartStore.isEditingCartProduct)

  defineProps<{
    isExpanded?: boolean
  }>()

  const locale = computed(() => profileStore.currentLocale || 'en')
  async function handleUpdateCartProduct() {
    if (!cartStore.editingCartItemId || !cartStore.editingFactoryProductId) {
      toast.error(msg_no_cart_product_selected({}, { locale: locale.value }), {
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
        toast.error(msg_add_roster_before_cart({}, { locale: locale.value }), {
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
        toast.success(msg_cart_updated({}, { locale: locale.value }), {
          position: 'top-right',
          richColors: true
        })
      }
    } catch (error) {
      toast.error(msg_failed_to_update_cart({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
      console.error('Update cart error:', error)
    }
  }

  async function handleAddToCart() {
    const totalQuantity = rosterEntries.value.reduce((sum, entry) => sum + (entry.quantity || 0), 0)
    if (totalQuantity === 0) {
      toast.error(msg_add_roster_entries_quantities({}, { locale: locale.value }), {
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

    const minDesignQty = minimumActiveProductQuantityByDesignToCard.value
    const isByDesign = isQuantityByDesign.value
    if (!canSkipMoq.value && isByDesign && totalQuantity < minDesignQty) {
      toast.error(
        `Please add at least ${minDesignQty} items to the roster before adding to cart.`,
        {
          position: 'top-right',
          richColors: true
        }
      )
      return
    }

    try {
      const { factory_product, product_assets } = await buildFactoryProductPayload()
      await cartStore.addProductToCart({
        factory_product,
        product_assets
      })
    } catch (error) {
      toast.error(msg_failed_to_add_to_cart({}, { locale: locale.value }), {
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
        v-if="!canSkipMoq"
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
      v-if="isLoggedIn && shouldShowAddToCartButton"
      variant="primary"
      :size="uiStore.isMobile ? 'sm' : 'lg'"
      class="w-full"
      :disabled="
        totalRosterQuantity <= 0 ||
        (!canSkipMoq &&
          isQuantityByDesign &&
          totalRosterQuantity < minimumActiveProductQuantityByDesignToCard) ||
        !authStore.isAuthenticated
      "
      @click="handleButtonClick"
    >
      <ShoppingCart class="size-4" />
      {{ buttonLabel }}
    </Button>
  </div>
</template>
