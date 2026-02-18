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
    X,
    File,
    Share2
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
  import { usePendingPostLoginAction } from '@/composables/usePendingPostLoginAction'
  import { computed, ref, watch } from 'vue'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { confirmDialog } from '@/lib/confirm-dialog'
  import LockerBrowser from '@/components/LockerBrowser.vue'
  import SaveDesignDialog from '@/components/SaveDesignDialog.vue'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useAppStore } from '@/stores/app/app.store'
  import { useCustomizerMenu } from '@/composables/useCustomizerMenu'
  import type { CustomizerStep } from '@/stores/workflow/workflow.store.types'
  import { useLoadLockerProductIntoCustomizer } from '@/composables/useLoadLockerProductIntoCustomizer.ts'
  import { useCartStore } from '@/stores/cart/cart.store'
  import { useBuildFactoryProduct } from '@/composables/useBuildFactoryProduct'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { useSceneStore } from '@/stores/scene/scene.store'
  import { base64ToFile, generateRandomString, uploadPresignedFiles } from '@/lib/utils'
  import type { SaveLockerProductPayload } from '@/services/lockers/types'
  import type { ShareDesignPayload } from '@/services/products/types/base-product'
  import type { ComponentPublicInstance } from 'vue'
  import { toast } from 'vue-sonner'
  import { useRoster } from '@/components/customization-workflow/WorkflowSteps/roster/useRoster'
  import ShareUrlTooltip from '@/components/shared/ShareUrlTooltip.vue'
  import { useLocalStorage } from '@/composables'
  import { useCompanyStore } from '@/stores/company/company.store'
  import { useLogosStore } from '@/stores/logos/logos.store'

  const uiStore = useUIStore()
  const profileStore = useProfileStore()
  const authStore = useAuthStore()
  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()
  const appStore = useAppStore()
  const history = useHistoryStore()
  const workflowStore = useWorkflowStore()
  const cartStore = useCartStore()
  const lockerRoomStore = useLockerRoomStore()
  const logosStore = useLogosStore()
  const sceneStore = useSceneStore()
  const companyStore = useCompanyStore()
  const { menuItems, goTo } = useCustomizerMenu()
  const { loadLockerProductIntoCustomizer } = useLoadLockerProductIntoCustomizer()
  const { buildFactoryProductPayload } = useBuildFactoryProduct()
  const { rosterEntries, ensureEditableRoster } = useRoster()
  const { openSignInDialog, handleLogout } = useSignIn()
  const { getPending, clearPending } = usePendingPostLoginAction()

  const { isAuthenticated: isLoggedIn, customer: user } = storeToRefs(authStore)

  // Reactive state
  const showProfileDialog = ref(false)
  const showLockerBrowser = ref(false)
  const showCartDialog = ref(false)
  const showSaveDesignDialog = ref(false)
  const initialLockerIdToOpen = ref<number | null>(null)
  const initialLockerTabToOpen = ref<'products' | 'assets' | 'colours' | 'rosters' | null>(null)

  // When a workflow step (Colors/Logos/Roster) requests "Choose from locker", open the browser with the right tab
  watch(
    () => lockerRoomStore.openLockerWithIntent,
    intent => {
      if (intent) {
        showLockerBrowser.value = true
        initialLockerTabToOpen.value = intent.tab
        lockerRoomStore.clearOpenLockerWithIntent()
      }
    }
  )
  const storageUrl = import.meta.env.VITE_APP_STORAGE_URL
  const sharedUrl = ref<string | null>(null)
  const showShareTooltip = ref(false)

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

  function getShareBaseUrl() {
    if (typeof window === 'undefined') return ''
    const origin = window.location.origin
    if (!appStore.appInfo?.is_subpage) return origin
    const subpageUrl = appStore.appInfo?.suppage_url ?? ''
    if (!subpageUrl) return origin
    const normalizedSubpage = `/${subpageUrl.replace(/^\/+/, '').replace(/\/+$/, '')}`
    return `${origin}${normalizedSubpage}`
  }

  function normalizeImageValue(value: unknown) {
    if (typeof value !== 'string') return ''
    if (!value) return ''
    if (value.startsWith('data:image')) return value
    if (value.startsWith('http://') || value.startsWith('https://')) return value
    if (!storageUrl) return value
    const base = storageUrl.replace(/\/+$/, '')
    const path = value.replace(/^\/+/, '')
    return `${base}/${path}`
  }

  function downloadPdfFile(base64: string, filename: string) {
    if (typeof window === 'undefined') return
    const cleanBase64 = base64.includes(',') ? (base64.split(',')[1] ?? '') : base64
    if (!cleanBase64) return

    const binaryString = window.atob(cleanBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const blob = new Blob([bytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename || 'customizer.pdf'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  async function handleGeneratePDF() {
    const toastId = toast.loading('Please wait your PDF is being generated', {
      position: 'top-right',
      richColors: true,
      duration: Infinity
    })

    try {
      // Run share design first to get the real shared URL for PDF generation
      const shared_url = await runShareDesignAndGetUrl()
      if (!shared_url) {
        toast.error('Failed to share design. PDF generation aborted.', {
          id: toastId,
          position: 'top-right',
          richColors: true
        })
        return
      }

      const { factory_product } = await buildFactoryProductPayload()
      const resolvedFrontImage = normalizeImageValue(factory_product.front_image)
      const resolvedBackImage = normalizeImageValue(factory_product.back_image)

      if (!resolvedBackImage) {
        toast.error('Missing back image for PDF generation', {
          id: toastId,
          position: 'top-right',
          richColors: true
        })
        return
      }

      const factoryProductPayload = {
        ...factory_product,
        front_image: resolvedFrontImage,
        back_image: resolvedBackImage
      }

      const response = await productsStore.generatePDF({
        factory_product: [factoryProductPayload],
        shared_url
      })

      if (response.success && response.content?.pdf) {
        downloadPdfFile(response.content.pdf, response.content.name)
        toast.success('PDF generated successfully! Downloading...', {
          id: toastId,
          position: 'top-right',
          richColors: true,
          duration: 4000
        })
      } else {
        toast.error('Something went wrong', {
          id: toastId,
          position: 'top-right',
          richColors: true
        })
      }
    } catch (error) {
      toast.error('Something went wrong', {
        id: toastId,
        position: 'top-right',
        richColors: true
      })
      console.error('Generate PDF error:', error)
    }
    toast.dismiss(toastId)
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
      // Check roster quantities before adding to cart
      const totalQuantity = rosterEntries.value.reduce(
        (sum, entry) => sum + (entry.quantity || 0),
        0
      )

      if (totalQuantity === 0) {
        toast.error('Please add roster entries with quantities before adding to cart', {
          position: 'top-right',
          richColors: true
        })

        // Navigate to roster step and open edit mode
        const visibleSteps = menuItems.value.map(i => i.step)
        if (visibleSteps.includes('roster')) {
          await goTo('roster')
          await ensureEditableRoster()
        } else {
          // If roster step is not available, go to the next available step
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
          const rosterIndex = order.indexOf('roster')
          const fallbackStart = rosterIndex >= 0 ? rosterIndex + 1 : 0
          for (let i = fallbackStart; i < order.length; i += 1) {
            const candidate = order[i]
            if (candidate && visibleSteps.includes(candidate)) {
              await goTo(candidate)
              break
            }
          }
        }
        return
      }

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
        frontImage = await (
          frontImageComponentRef as unknown as ComponentPublicInstance & {
            getImageFromCanvas: () => Promise<string>
          }
        ).getImageFromCanvas()
      }

      const backImageComponentRef = sceneStore.getTwoDSceneRef('back')
      if (backImageComponentRef && 'getImageFromCanvas' in backImageComponentRef) {
        backImage = await (
          backImageComponentRef as unknown as ComponentPublicInstance & {
            getImageFromCanvas: () => Promise<string>
          }
        ).getImageFromCanvas()
      }

      const componentRef = sceneStore.threeDSceneRef
      if (componentRef && 'getImageFromCanvas' in componentRef) {
        const getImage = (
          componentRef as unknown as ComponentPublicInstance & {
            getImageFromCanvas: (side?: string) => Promise<string>
          }
        ).getImageFromCanvas
        frontImage = await getImage('front')
        backImage = await getImage('back')
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
      const rawSvgParts = productsStore.activeDesignDetails?.svg_parts || []
      const svgParts = Array.isArray(rawSvgParts)
        ? rawSvgParts
        : typeof rawSvgParts === 'string'
          ? JSON.parse(rawSvgParts)
          : []
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

      const locker: SaveLockerProductPayload = {
        id: lockerRoomStore.editingLockerProductId,
        addons: addonsInfo,
        roster_url: false,
        room_id: lockerId,
        product_id: productId,
        product_name: lockerProductName,
        svg_parts: svgParts,
        style_id: customization.style_id || 0,
        design_id: customization.design_id || 0,
        custom_logos: customLogos,
        text: productCustomTexts,
        colors: customization.group_colors ?? [],
        shuffle_color_number: customization.shuffle_color_number || 0,
        defaultcolors: defaultColors,
        groupcolors: groupColors,
        front_image: signedUrls.urls.find(item => item.file_side === 'front')!.original_url,
        back_image: signedUrls.urls.find(item => item.file_side === 'back')!.original_url,
        product_roster_detail: rosterDetail,
        fixed_logo_index: customization.fixed_logo_index || 0,
        svgcolors: svgcolors,
        grouped_addons: groupedAddons,
        ungrouped_addons: ungroupedAddons,
        group_patterns: customization.group_patterns || {},
        category_id: customizationStore.activeCategoryId ?? undefined,
        sub_category_id: customizationStore.activeSubCategoryId ?? null
      }

      const success = await lockerRoomStore.updateLockerProduct(locker, lockerId)

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
  async function onLoginSuccess() {
    const pending = getPending()
    clearPending()
    await lockerRoomStore.fetchLockersWithcolors()
    await logosStore.fetchRecentLogos()
    await cartStore.fetchCart(true)
    if (pending === 'updateCart') {
      await handleUpdateCartProduct()
    } else if (pending === 'addToCart') {
      await handleAddToCart()
    }
  }

  /**
   * Runs share design (upload images, register design) and returns the shared URL.
   * Returns null if share fails. Used by both Share Design button and Generate PDF.
   */
  async function runShareDesignAndGetUrl(): Promise<string | null> {
    try {
      // Get images from canvas
      let frontImage = ''
      let backImage = ''

      const frontImageComponentRef = sceneStore.getTwoDSceneRef('front')
      if (frontImageComponentRef && 'getImageFromCanvas' in frontImageComponentRef) {
        frontImage = await (
          frontImageComponentRef as unknown as ComponentPublicInstance & {
            getImageFromCanvas: () => Promise<string>
          }
        ).getImageFromCanvas()
      }

      const backImageComponentRef = sceneStore.getTwoDSceneRef('back')
      if (backImageComponentRef && 'getImageFromCanvas' in backImageComponentRef) {
        backImage = await (
          backImageComponentRef as unknown as ComponentPublicInstance & {
            getImageFromCanvas: () => Promise<string>
          }
        ).getImageFromCanvas()
      }

      const componentRef = sceneStore.threeDSceneRef
      if (componentRef && 'getImageFromCanvas' in componentRef) {
        const getImage = (
          componentRef as unknown as ComponentPublicInstance & {
            getImageFromCanvas: (side?: string) => Promise<string>
          }
        ).getImageFromCanvas
        frontImage = await getImage('front')
        backImage = await getImage('back')
      }

      if (!frontImage || !backImage) {
        toast.error('Failed to get images from canvas', {
          position: 'top-right',
          richColors: true
        })
        return null
      }

      const { getItemRaw } = useLocalStorage()
      const companyIdRaw = getItemRaw('__customizer_company_id__')
      const companyId = companyIdRaw ? Number(companyIdRaw) : undefined
      if (!companyId) {
        toast.error('Company ID not found', { position: 'top-right', richColors: true })
        return null
      }

      const factoryId = productsStore.activeProductDetails?.factory_id ?? null
      const frontFile = base64ToFile(frontImage, 'front.png')
      const backFile = base64ToFile(backImage, 'back.png')

      const signedUrlResponse = await cartStore.generateSignedUploadUrl({
        files: [
          { name: frontFile.name, type: frontFile.type, size: frontFile.size },
          { name: backFile.name, type: backFile.type, size: backFile.size }
        ],
        companyId: companyId,
        factoryId: factoryId,
        type: 'share_product' as const
      } as unknown as Parameters<typeof cartStore.generateSignedUploadUrl>[0])

      if (
        !signedUrlResponse ||
        !signedUrlResponse.result?.urls ||
        signedUrlResponse.result.urls.length === 0
      ) {
        toast.error('Failed to generate signed upload URLs', {
          position: 'top-right',
          richColors: true
        })
        return null
      }

      // Upload images
      const urlItems = signedUrlResponse.result.urls
      const presignedFiles: Array<{
        file: File
        presigned_url: string
        file_type: string
        file_side?: string
      }> = []
      let frontUrlItem: (typeof urlItems)[0] | undefined
      let backUrlItem: (typeof urlItems)[0] | undefined

      urlItems.forEach((urlItem, index) => {
        const file = index === 0 ? frontFile : backFile
        const isFront =
          urlItem.file_path?.includes('_front') ||
          urlItem.file_side === 'front' ||
          file.name === 'front.png'
        const isBack =
          urlItem.file_path?.includes('_back') ||
          urlItem.file_side === 'back' ||
          file.name === 'back.png'

        presignedFiles.push({
          file,
          presigned_url: urlItem.signed_url,
          file_type: urlItem.file_type || 'image/png',
          file_side: isFront ? 'front' : 'back'
        })

        if (isFront) {
          frontUrlItem = urlItem
        } else if (isBack) {
          backUrlItem = urlItem
        }
      })

      const uploadResults = await uploadPresignedFiles(presignedFiles)
      if (!uploadResults.every(r => r.success)) {
        toast.error('Failed to upload images', { position: 'top-right', richColors: true })
        return null
      }

      const customization = customizationStore.customization
      const productId = productsStore.activeProductDetails?.product_id
      if (!productId || !customization) {
        toast.error('Missing product or customization data', {
          position: 'top-right',
          richColors: true
        })
        return null
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

      const randString = generateRandomString()
      const productDisplayName = productsStore.activeProductDetails?.display_name || 'Product'
      const encodedName = encodeURIComponent(productDisplayName).replace(/%20/g, '+')

      const shareDesignPayload: ShareDesignPayload = {
        addons: addonsInfo ?? [],
        roster_url: `${getShareBaseUrl()}/share/${encodedName}/${randString}`,
        product_id: productId,
        product_name: productDisplayName,
        svg_parts: typeof svgParts === 'string' ? JSON.parse(svgParts) : svgParts,
        style_id: customization.style_id || 0,
        design_id: customization.design_id || 0,
        custom_logos: customLogos,
        text: productCustomTexts,
        colors: customization.group_colors ?? [],
        shuffle_color_number: customization.shuffle_color_number || 0,
        defaultcolors: defaultColors,
        groupcolors: groupColors,
        front_image: frontUrlItem?.file_path || '',
        back_image: backUrlItem?.file_path || '',
        product_roster_detail: rosterDetail,
        fixed_logo_index: customization.fixed_logo_index || 0,
        svgcolors: svgcolors,
        grouped_addons: groupedAddons,
        ungrouped_addons: ungroupedAddons,
        group_patterns: customization.group_patterns || {},
        rand_string: randString,
        room_id: null,
        category_id: customizationStore.activeCategoryId ?? undefined,
        sub_category_id: customizationStore.activeSubCategoryId ?? null
      }

      const response = await productsStore.shareDesign(shareDesignPayload)

      if (response.success && response.content?.url) {
        return response.content.url
      }
      toast.error('Failed to share design', {
        position: 'top-right',
        richColors: true
      })
      return null
    } catch (error) {
      toast.error('Failed to share design', {
        position: 'top-right',
        richColors: true
      })
      console.error('Share design error:', error)
      return null
    }
  }

  async function handleShareDesign() {
    sharedUrl.value = null
    showShareTooltip.value = false

    const url = await runShareDesignAndGetUrl()
    if (url) {
      sharedUrl.value = url
      showShareTooltip.value = true
      toast.success('Design shared successfully!', {
        position: 'top-right',
        richColors: true,
        duration: 3000
      })
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
        <template v-if="cartStore.isEditingCartProduct && isLoggedIn">
          <!-- Simple Update Button when editing cart product -->
          <Button variant="outline" size="default" @click="handleUpdateCartProduct">
            <Save class="size-4" />
            <span>Update</span>
          </Button>
        </template>
        <template v-else-if="lockerRoomStore.isEditingLockerProduct && isLoggedIn">
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
              Save to Locker
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="!(companyStore.isEcommercePlatform && authStore.hasAdminToken)"
              @click="handleAddToCart"
            >
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

      <!-- Share Design Button -->
      <ButtonGroup v-if="!uiStore.isMobile && authStore.isAuthenticated">
        <ShareUrlTooltip
          :share-url="sharedUrl"
          :open="showShareTooltip"
          @update:open="showShareTooltip = $event"
        >
          <Button variant="outline" size="default" @click="handleShareDesign">
            <Share2 class="size-4" />
            <span>Share Design</span>
          </Button>
        </ShareUrlTooltip>
      </ButtonGroup>

      <!-- Generate PDF Button -->
      <ButtonGroup v-if="!uiStore.isMobile && authStore.isAuthenticated">
        <Button variant="outline" size="default" @click="handleGeneratePDF">
          <File class="size-4" />
          <span>Generate PDF</span>
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
      <ButtonGroup
        v-if="!uiStore.isMobile && authStore.isAuthenticated && !companyStore.isEcommercePlatform"
      >
        <Button variant="outline" size="default" class="relative" @click="handleCartClick">
          <ShoppingCart class="size-4" />
          <span>{{ topbar_cart({}, { locale: profileStore.currentLocale }) }}</span>
          <span
            v-if="cartStore.cartItemsCount > 0"
            class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-xs font-semibold text-white"
          >
            {{ cartStore.cartItemsCount }}
          </span>
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
            class="relative"
            @click="handleCartClick"
          >
            <ShoppingCart class="size-4 mr-2" />
            <span>{{ topbar_cart({}, { locale: profileStore.currentLocale }) }}</span>
            <span
              v-if="cartStore.cartItemsCount > 0"
              class="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-xs font-semibold text-white"
            >
              {{ cartStore.cartItemsCount }}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="uiStore.isMobile && authStore.isAuthenticated"
            @click="showLockerBrowser = true"
          >
            <LayoutGrid class="size-4 mr-2" />
            <span>{{ topbar_locker_room({}, { locale: profileStore.currentLocale }) }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="uiStore.isMobile && authStore.isAuthenticated"
            @click="handleGeneratePDF"
          >
            <File class="size-4 mr-2" />
            <span>Generate PDF</span>
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
        <SignInDialog @success="onLoginSuccess" />
      </DropdownMenu>
    </ButtonGroup>
    <LockerBrowser
      :open="showLockerBrowser"
      :initial-locker-id="initialLockerIdToOpen"
      :initial-tab="initialLockerTabToOpen"
      @update:open="
        evt => {
          showLockerBrowser = evt
          if (!evt) initialLockerTabToOpen = null
        }
      "
      @edit-product="handleEditLockerProduct"
      @initial-locker-opened="initialLockerIdToOpen = null"
      @clear-initial-tab="initialLockerTabToOpen = null"
    />
    <SaveDesignDialog
      :open="showSaveDesignDialog"
      @update:open="showSaveDesignDialog = $event"
      @saved-to-locker="
        id => {
          initialLockerIdToOpen = id
          showLockerBrowser = true
        }
      "
    />
    <CartDialog v-if="isLoggedIn" :open="showCartDialog" @update:open="showCartDialog = $event" />
  </div>
</template>

<style scoped></style>
