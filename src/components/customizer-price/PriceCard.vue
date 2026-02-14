<script setup lang="ts">
  import { Card, CardContent } from '@/components/ui/card'
  import { Button } from '@/components/ui/button'
  import { price_line, price_add_to_cart } from '@/paraglide/messages'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useCartStore } from '@/stores/cart/cart.store'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { useBuildFactoryProduct } from '@/composables/useBuildFactoryProduct'
  import { useSignIn } from '@/composables/useSignIn'
  import { usePendingPostLoginAction } from '@/composables/usePendingPostLoginAction'
  import { useRoster } from '@/components/customization-workflow/WorkflowSteps/roster/useRoster'
  import { useCustomizerMenu } from '@/composables/useCustomizerMenu'
  import { useCompanyStore } from '@/stores/company/company.store'
  import { storeToRefs } from 'pinia'
  import { computed } from 'vue'
  import { toast } from 'vue-sonner'

  defineProps<{ price?: number; qty?: number; eta?: string }>()
  const profileStore = useProfileStore()
  const cartStore = useCartStore()
  const authStore = useAuthStore()
  const companyStore = useCompanyStore()
  const { buildFactoryProductPayload } = useBuildFactoryProduct()
  const { openSignInDialog } = useSignIn()
  const { setPending } = usePendingPostLoginAction()
  const { rosterEntries, ensureEditableRoster } = useRoster()
  const { menuItems, goTo } = useCustomizerMenu()

  const { isAuthenticated: isLoggedIn } = storeToRefs(authStore)
  const isEditingCartProduct = computed(() => cartStore.isEditingCartProduct)

  async function handleUpdateCartProduct() {
    if (!cartStore.editingCartItemId || !cartStore.editingFactoryProductId) {
      toast.error('No cart product selected for update', {
        position: 'top-right',
        richColors: true
      })
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
    const { factory_product, product_assets } = await buildFactoryProductPayload()
    await cartStore.addProductToCart({
      factory_product,
      product_assets
    })
    toast.success('Product added to cart', {
      position: 'top-right',
      richColors: true
    })
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
  <Card class="w-[320px] p-0">
    <CardContent class="p-4 flex items-center justify-between gap-4">
      <div class="flex flex-col">
        <div class="text-lg font-semibold">${{ (price ?? 56.99).toFixed(2) }}</div>
        <div class="text-xs text-muted-foreground">
          {{
            price_line(
              { qty: qty ?? 10, eta: eta ?? '25-27 Feb 2025' },
              { locale: profileStore.currentLocale }
            )
          }}
        </div>
      </div>
      <Button
        v-if="isLoggedIn && !(companyStore.isEcommercePlatform && authStore.hasAdminToken)"
        size="sm"
        class="rounded-xl px-5"
        @click="handleButtonClick"
      >
        {{ buttonLabel }}
      </Button>
    </CardContent>
  </Card>
</template>

<style scoped></style>
