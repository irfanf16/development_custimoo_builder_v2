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
    Fullscreen
  } from 'lucide-vue-next'
  import {
    topbar_save,
    topbar_locker_room,
    topbar_cart,
    topbar_save_options,
    actions_reset_customization
  } from '@/paraglide/messages'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import SignInButton from '@/components/auth/SignInButton.vue'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { storeToRefs } from 'pinia'
  import ProfileDialog from '@/components/customizer-profile-section/ProfileDialog.vue'
  import SignInDialog from '@/components/auth/SignInDialog.vue'
  import { CartDialog } from '@/components/cart'
  import { useSignIn } from '@/composables/useSignIn'
  import { ref } from 'vue'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { confirmDialog } from '@/lib/confirm-dialog'
  import LockerBrowser from '@/components/LockerBrowser.vue'
  import SaveDesignDialog from '@/components/SaveDesignDialog.vue'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useCustomizerMenu } from '@/composables/useCustomizerMenu'
  import type { CustomizerStep } from '@/stores/workflow/workflow.store.types'
  import { useLoadLockerProductIntoCustomizer } from '@/composables/useLoadLockerProductIntoCustomizer.ts'
  import { toast } from 'vue-sonner'

  const uiStore = useUIStore()
  const profileStore = useProfileStore()
  const authStore = useAuthStore()
  const customizationStore = useCustomizationStore()
  const history = useHistoryStore()
  const workflowStore = useWorkflowStore()
  const { menuItems, goTo } = useCustomizerMenu()
  const { loadLockerProductIntoCustomizer } = useLoadLockerProductIntoCustomizer()
  const { openSignInDialog, handleLogout } = useSignIn()

  const { isAuthenticated: isLoggedIn, customer: user } = storeToRefs(authStore)

  // Reactive state
  const showProfileDialog = ref(false)
  const showLockerBrowser = ref(false)
  const showCartDialog = ref(false)
  const showSaveDesignDialog = ref(false)
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

  function handleSaveAsDraft() {
    showSaveDesignDialog.value = true
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
    lockerProduct?: import('@/services/lockers/types').LockerProduct
  }) {
    const desiredStep = (workflowStore.activeStep || 'product') as CustomizerStep
    showLockerBrowser.value = false

    const ok = await loadLockerProductIntoCustomizer(payload.lockerProductId, payload.lockerProduct)
    if (!ok) {
      toast.error('Failed to load locker product', { position: 'top-right', richColors: true })
      return
    }

    workflowStore.resetWorkflowSubSteps()
    const visibleSteps = menuItems.value.map(i => i.step)
    const nextStep = pickStepOrNextAvailable(desiredStep, visibleSteps)

    await goTo(nextStep)
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
        <DropdownMenu v-if="authStore.isAuthenticated">
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
      <!-- Locker Room Button -->
      <ButtonGroup v-if="!uiStore.isMobile && authStore.isAuthenticated">
        <Button size="default" @click="showLockerBrowser = true">
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
              aria-label="User menu"
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
