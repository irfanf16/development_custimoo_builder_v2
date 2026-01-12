<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { ButtonGroup } from '@/components/ui/button-group'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
  } from '@/components/ui/dropdown-menu'
  import {
    Save,
    ShoppingCart,
    RotateCcw,
    ChevronDown,
    Menu,
    User,
    Settings,
    LogOut,
    LogIn,
    LayoutGrid,
    Fullscreen,
    Ruler,
    X
  } from 'lucide-vue-next'
  import {
    topbar_save,
    topbar_locker_room,
    topbar_cart,
    topbar_save_options,
    actions_reset_customization,
    ui_aria_user_menu
  } from '@/paraglide/messages'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import SignInButton from '@/components/auth/SignInButton.vue'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { storeToRefs } from 'pinia'
  import ProfileDialog from '@/components/customizer-profile-section/ProfileDialog.vue'
  import SignInDialog from '@/components/auth/SignInDialog.vue'
  import { CartDialog } from '@/components/cart'
  import { useSignIn } from '@/composables/useSignIn'
  import { computed, ref } from 'vue'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { confirmDialog } from '@/lib/confirm-dialog'
  import LockerBrowser from '@/components/LockerBrowser.vue'
  import SaveDesignDialog from '@/components/SaveDesignDialog.vue'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useCustomizerMenu } from '@/composables/useCustomizerMenu'
  import type { CustomizerStep } from '@/stores/workflow/workflow.store.types'
  import { useLoadLockerProductIntoCustomizer } from '@/composables/useLoadLockerProductIntoCustomizer.ts'
  import { useCartStore } from '@/stores/cart/cart.store'
  import { useBuildFactoryProduct } from '@/composables/useBuildFactoryProduct'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { useSceneStore } from '@/stores/scene/scene.store'
  import { base64ToFile, objectToFormData, uploadPresignedFiles } from '@/lib/utils'
  import type { ComponentPublicInstance } from 'vue'
  import { toast } from 'vue-sonner'

  const uiStore = useUIStore()
  const profileStore = useProfileStore()
  const authStore = useAuthStore()
  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()
  const history = useHistoryStore()
  const workflowStore = useWorkflowStore()
  const cartStore = useCartStore()
  const lockerRoomStore = useLockerRoomStore()
  const sceneStore = useSceneStore()
  const { menuItems, goTo } = useCustomizerMenu()
  const { loadLockerProductIntoCustomizer } = useLoadLockerProductIntoCustomizer()
  const { buildFactoryProductPayload } = useBuildFactoryProduct()
  const { openSignInDialog, handleLogout } = useSignIn()

  const { isAuthenticated: isLoggedIn, customer: user } = storeToRefs(authStore)

  // Reactive state
  const showProfileDialog = ref(false)
  const showLockerBrowser = ref(false)
  const showCartDialog = ref(false)
  const showSaveDesignDialog = ref(false)
  const storageUrl = import.meta.env.VITE_APP_STORAGE_URL

  const skuInformation = computed(() => productsStore?.activeProductDetails?.sku)

  // Methods
  async function handleResetCustomization() {
    const ok = await confirmDialog({
      title: actions_reset_customization({}, { locale: profileStore.currentLocale }),
      description: "This will clear all current selections and history. You can't undo this action."
    })
    if (ok) {
      customizationStore.clearCustomization()
      history.clear()
    }
  }

  async function handleSaveAsDraft() {
    if (cartStore.isEditingCartProduct) {
      // Update existing cart item
      await handleUpdateCartProduct()
    } else {
      // Save as draft to locker
      showSaveDesignDialog.value = true
    }
  }

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

    // Only clear editing state if update was successful
    // The store returns null on failure, or the response object with success: true on success
    if (result && !result.errors.length) {
      cartStore.clearEditingCartProduct()
    }
  }

  async function handleAddToCart() {
    try {
      const { factory_product, product_assets } = await buildFactoryProductPayload()

      await cartStore.addProductToCart({
        factory_product,
        product_assets
      })
    } catch (error) {
      console.error('Add to cart error:', error)
    }
  }

  function handleSaveAndShare() {
    // Handle save and share
  }

  function handleExportDesign() {
    // Handle export design
  }
  function handleUserProfile() {
    showProfileDialog.value = true
  }

  function handleUserSettings() {
    // Handle user settings
  }

  function handleSignOut() {
    handleLogout()
  }

  function handleSignIn() {
    openSignInDialog()
  }

  function handleFullscreen() {
    uiStore.toggleFullscreen()
  }

  function handleCartClick() {
    showCartDialog.value = true
  }

  function pickStepOrNextAvailable(
    desired: CustomizerStep,
    visible: CustomizerStep[]
  ): CustomizerStep {
    if (visible.includes(desired)) return desired
    const order: CustomizerStep[] = [
      'product',
      'designs',
      'styles',
      'logos',
      'colors',
      'patterns',
      'texts',
      'roster',
      'summary'
    ]
    const desiredIndex = order.indexOf(desired)
    const fallbackStart = desiredIndex >= 0 ? desiredIndex + 1 : 0
    for (let i = fallbackStart; i < order.length; i += 1) {
      const candidate = order[i]
      if (candidate && visible.includes(candidate)) return candidate
    }
    return visible[0] ?? 'product'
  }

  async function handleEditLockerProduct(payload: {
    lockerProductId: number
    lockerId: number
    lockerProduct?: import('@/services/lockers/types').LockerProduct
  }) {
    const desiredStep = (workflowStore.activeStep || 'product') as CustomizerStep
    showLockerBrowser.value = false

    const ok = await loadLockerProductIntoCustomizer(
      payload.lockerProductId,
      payload.lockerProduct,
      payload.lockerId
    )
    if (!ok) {
      toast.error('Failed to load locker product', { position: 'top-right', richColors: true })
      return
    }

    workflowStore.resetWorkflowSubSteps()
    const visibleSteps = menuItems.value.map(i => i.step)
    const nextStep = pickStepOrNextAvailable(desiredStep, visibleSteps)

    await goTo(nextStep)
  }

  function handleCancelLockerProductEdit() {
    // Clear editing state but keep product loaded
    lockerRoomStore.clearEditingLockerProduct()
  }

  async function handleUpdateLockerProduct() {
    if (!lockerRoomStore.editingLockerProductId || !lockerRoomStore.editingLockerId) {
      toast.error('No locker product selected for update', {
        position: 'top-right',
        richColors: true
      })
      return
    }

    try {
      const lockerId = lockerRoomStore.editingLockerId
      const signedUrls = await lockerRoomStore.getSignedUrl(lockerId)
      if (!signedUrls) {
        toast.error('Failed to get signed URLs', { position: 'top-right', richColors: true })
        return
      }

      // Get images from canvas
      let frontImage = ''
      let backImage = ''

      const frontImageComponentRef = sceneStore.getTwoDSceneRef('front')
      if (frontImageComponentRef && 'getImageFromCanvas' in frontImageComponentRef) {
        frontImage = (
          frontImageComponentRef as unknown as ComponentPublicInstance & {
            getImageFromCanvas: () => string
          }
        ).getImageFromCanvas()
      }

      const backImageComponentRef = sceneStore.getTwoDSceneRef('back')
      if (backImageComponentRef && 'getImageFromCanvas' in backImageComponentRef) {
        backImage = (
          backImageComponentRef as unknown as ComponentPublicInstance & {
            getImageFromCanvas: () => string
          }
        ).getImageFromCanvas()
      }

      const componentRef = sceneStore.threeDSceneRef
      if (componentRef && 'getImageFromCanvas' in componentRef) {
        frontImage = (
          componentRef as unknown as ComponentPublicInstance & {
            getImageFromCanvas: (side?: string) => string
          }
        ).getImageFromCanvas('front')
        backImage = (
          componentRef as unknown as ComponentPublicInstance & {
            getImageFromCanvas: (side?: string) => string
          }
        ).getImageFromCanvas('back')
      }

      // Upload images
      const preparedFiles = signedUrls.urls.map(u => {
        return {
          presigned_url: u.presigned_url,
          file_type: u.file_type,
          file:
            u.file_side === 'front'
              ? base64ToFile(frontImage, 'front.png')
              : base64ToFile(backImage, 'back.png'),
          file_side: u.file_side
        }
      })
      const results = await uploadPresignedFiles(preparedFiles)
      if (!results.every(r => r.success)) {
        toast.error('Failed to upload images', { position: 'top-right', richColors: true })
        return
      }

      // Build locker product payload
      const customization = customizationStore.customization
      const productId = productsStore.activeProductDetails?.product_id
      if (!productId || !customization) {
        toast.error('Missing product or customization data', {
          position: 'top-right',
          richColors: true
        })
        return
      }

      const productKey = String(productId)
      const svgParts = productsStore.activeDesignDetails?.svg_parts || []
      const customLogos = customization.custom_logos[productKey] || []
      const productCustomTexts = customization.product_custom_texts[productKey] || []
      const rosterDetail = customization.products_rosters[productKey] || []
      const defaultColors = customization.default_colors || []
      const groupColors = customization.group_colors || {}
      const svgcolors = productsStore.svgGroups.map(group => ({
        value: group.color || '',
        name: group.name || '',
        pantone: group.pantone || ''
      }))
      const addonsInfo = customization.addons_info || {}
      const groupedAddons =
        Object.keys(addonsInfo).length > 0
          ? Object.values(addonsInfo).reduce(
              (acc, addonInfo) => {
                const grouped =
                  (addonInfo as { grouped_addons?: Record<string, unknown> })?.grouped_addons || {}
                return { ...acc, ...grouped }
              },
              {} as Record<string, unknown>
            )
          : {}
      const ungroupedAddons = Object.values(addonsInfo).flatMap(
        addonInfo => (addonInfo as { ungrouped_addons?: unknown[] })?.ungrouped_addons || []
      )

      // Get product name from locker product if available, otherwise use empty string
      const lockerProductName =
        lockerRoomStore.editingLockerProduct?.product_name ||
        lockerRoomStore.editingLockerProduct?.name ||
        ''

      const locker = {
        id: lockerRoomStore.editingLockerProductId,
        addons: [],
        roster_url: false,
        room_id: lockerId,
        product_id: productId,
        product_name: lockerProductName,
        svg_parts: JSON.stringify(svgParts),
        style_id: customization.style_id || 0,
        design_id: customization.design_id || 0,
        custom_logos: JSON.stringify(customLogos),
        text: JSON.stringify(productCustomTexts),
        colors: [],
        shuffle_color_number: customization.shuffle_color_number || 0,
        defaultcolors: JSON.stringify(defaultColors),
        groupcolors: JSON.stringify(groupColors),
        front_image: signedUrls.urls.find(item => item.file_side === 'front')!.original_url,
        back_image: signedUrls.urls.find(item => item.file_side === 'back')!.original_url,
        product_roster_detail: JSON.stringify(rosterDetail),
        fixed_logo_index: customization.fixed_logo_index || 0,
        svgcolors: JSON.stringify(svgcolors),
        grouped_addons: JSON.stringify(groupedAddons),
        ungrouped_addons: JSON.stringify(ungroupedAddons),
        group_patterns: JSON.stringify(customization.group_patterns || {})
      }

      const payload = objectToFormData(locker)
      const success = await lockerRoomStore.updateLockerProduct(payload, lockerId)

      if (success) {
        lockerRoomStore.clearEditingLockerProduct()
        toast.success('Locker product updated successfully', {
          position: 'top-right',
          richColors: true
        })
      }
    } catch (error) {
      toast.error('Failed to update locker product', {
        position: 'top-right',
        richColors: true
      })
      console.error('Update locker product error:', error)
    }
  }
</script>

<template>
  <!-- Right aligned action group using ButtonGroup -->
  <div class="flex items-center gap-2">
    <ButtonGroup class="flex w-full justify-between md:w-auto md:justify-normal">
      <!-- Reset Button -->
      <ButtonGroup v-if="!uiStore.isMobile">
        <Button variant="outline" size="default" @click="handleResetCustomization">
          <RotateCcw class="size-4" />
          {{ actions_reset_customization({}, { locale: profileStore.currentLocale }) }}
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <!-- Fullscreen Button for mobile only -->
        <ButtonGroup v-if="uiStore.isMobile">
          <Button variant="outline" size="icon" @click="handleFullscreen">
            <Fullscreen class="size-4" />
          </Button>
        </ButtonGroup>
        <!-- Save Button Group with DropdownMenu -->
        <template v-if="cartStore.isEditingCartProduct">
          <!-- Simple Update Button when editing cart product -->
          <Button variant="outline" size="default" @click="handleUpdateCartProduct">
            <Save class="size-4" />
            <span>Update</span>
          </Button>
        </template>
        <template v-else-if="lockerRoomStore.isEditingLockerProduct">
          <!-- Update and Cancel buttons when editing locker product -->
          <ButtonGroup>
            <Button variant="outline" size="default" @click="handleCancelLockerProductEdit">
              <X class="size-4" />
              <span>Cancel</span>
            </Button>
            <Button variant="outline" size="default" @click="handleUpdateLockerProduct">
              <Save class="size-4" />
              <span>Update</span>
            </Button>
          </ButtonGroup>
        </template>
        <DropdownMenu v-else-if="authStore.isAuthenticated">
          <ButtonGroup>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="default">
                <Save class="size-4" />
                <span>{{ topbar_save({}, { locale: profileStore.currentLocale }) }}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuTrigger as-child>
              <Button
                variant="outline"
                size="icon"
                :aria-label="topbar_save_options({}, { locale: profileStore.currentLocale })"
              >
                <ChevronDown class="size-4" />
              </Button>
            </DropdownMenuTrigger>
          </ButtonGroup>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="handleSaveAsDraft">
              <Save class="size-4 mr-2" />
              Save as Draft
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleAddToCart">
              <ShoppingCart class="size-4 mr-2" />
              Add to Cart
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleSaveAndShare">
              <Save class="size-4 mr-2" />
              Save and Share
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleExportDesign">
              <Save class="size-4 mr-2" />
              Export Design
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>

      <!-- Size Guide Button -->
      <ButtonGroup v-if="!uiStore.isMobile && skuInformation?.image_url">
        <Button
          variant="outline"
          size="default"
          as="a"
          target="_blank"
          :href="`${storageUrl}${skuInformation.image_url}`"
        >
          <Ruler class="size-4" />
          <span>Size Guide</span>
        </Button>
      </ButtonGroup>

      <!-- Locker Room Button -->
      <ButtonGroup v-if="!uiStore.isMobile && authStore.isAuthenticated">
        <Button variant="outline" size="default" @click="showLockerBrowser = true">
          <LayoutGrid class="size-4" />
          <span>{{ topbar_locker_room({}, { locale: profileStore.currentLocale }) }}</span>
        </Button>
      </ButtonGroup>

      <!-- Cart Button -->
      <ButtonGroup v-if="!uiStore.isMobile && authStore.isAuthenticated">
        <Button variant="outline" size="default" @click="handleCartClick">
          <ShoppingCart class="size-4" />
          <span>{{ topbar_cart({}, { locale: profileStore.currentLocale }) }}</span>
        </Button>
      </ButtonGroup>

      <!-- Sign In Button with DropdownMenu -->
      <DropdownMenu>
        <ButtonGroup>
          <SignInButton @open-profile="handleUserProfile" />
          <DropdownMenuTrigger as-child>
            <Button
              variant="outline"
              size="icon"
              :aria-label="ui_aria_user_menu({}, { locale: profileStore.currentLocale })"
              class="rounded-l-md rounded-r-md"
            >
              <Menu class="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </ButtonGroup>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel v-if="isLoggedIn"
            >{{ user?.first_name }} {{ user?.last_name }}</DropdownMenuLabel
          >
          <DropdownMenuSeparator v-if="isLoggedIn" />

          <!-- Mobile only -->
          <DropdownMenuItem
            v-if="uiStore.isMobile && authStore.isAuthenticated"
            @click="handleCartClick"
          >
            <ShoppingCart class="size-4 mr-2" />
            <span>{{ topbar_cart({}, { locale: profileStore.currentLocale }) }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="uiStore.isMobile && authStore.isAuthenticated"
            @click="showLockerBrowser = true"
          >
            <LayoutGrid class="size-4 mr-2" />
            <span>{{ topbar_locker_room({}, { locale: profileStore.currentLocale }) }}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="uiStore.isMobile && authStore.isAuthenticated" />

          <!-- Always visible -->
          <DropdownMenuItem v-if="isLoggedIn" @click="handleUserProfile">
            <User class="size-4 mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem v-else @click="handleUserProfile">
            <Settings class="size-4 mr-2" />
            Preferences
          </DropdownMenuItem>
          <DropdownMenuItem v-if="isLoggedIn" @click="handleUserSettings">
            <Settings class="size-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="isLoggedIn" />
          <DropdownMenuItem v-if="isLoggedIn" class="text-red-600" @click="handleSignOut">
            <LogOut class="size-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
          <DropdownMenuItem v-else @click="handleSignIn">
            <LogIn class="size-4 mr-2" />
            Sign In
          </DropdownMenuItem>
        </DropdownMenuContent>
        <ProfileDialog :open="showProfileDialog" @update:open="showProfileDialog = $event" />
        <SignInDialog />
      </DropdownMenu>
    </ButtonGroup>
    <LockerBrowser
      :open="showLockerBrowser"
      @update:open="showLockerBrowser = $event"
      @edit-product="handleEditLockerProduct"
    />
    <SaveDesignDialog :open="showSaveDesignDialog" @update:open="showSaveDesignDialog = $event" />
    <CartDialog :open="showCartDialog" @update:open="showCartDialog = $event" />
  </div>
</template>

<style scoped></style>
