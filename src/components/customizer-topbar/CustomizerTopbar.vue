<script setup lang="ts">
  import ProfileDialog from '@/components/customizer-profile-section/ProfileDialog.vue'
import ResetCustomizationDialog from '@/components/customizer/ResetCustomizationDialog.vue'
import SignInDialog from '@/components/SignInDialog.vue'
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
  actions_reset_customization,
  topbar_cart,
  topbar_locker_room,
  topbar_save,
  topbar_save_options
} from '@/paraglide/messages'
import { useAuthStore } from '@/stores/auth/auth.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useHistoryStore } from '@/stores/history/history.store'
import { useProfileStore } from '@/stores/profile/profile.store'
import { useUIStore } from '@/stores/ui/ui.store'
import {
  ChevronDown,
  Fullscreen,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  RotateCcw,
  Save,
  Settings,
  ShoppingCart,
  User
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import LockerBrowser from '../LockerBrowser.vue'
import SignInButton from '../SignInButton.vue'


  const uiStore = useUIStore()
  const customizationStore = useCustomizationStore()
  const history = useHistoryStore()
  const profileStore = useProfileStore()
  const authStore = useAuthStore()

  const { isAuthenticated: isLoggedIn, customer: user } = storeToRefs(authStore)

  // Reactive state
  const showProfileDialog = ref(false)
  const showSignInDialog = ref(false)
  const showResetDialog = ref(false)
  const showLockerBrowser = ref(false)

  // Methods
  function handleResetCustomization() {
    showResetDialog.value = true
  }

  function confirmResetCustomization() {
    customizationStore.clearCustomization()
    history.clear()
    showResetDialog.value = false
  }

  function handleSaveAsDraft() {
    // Handle save as draft
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
    authStore.logout()
  }

  function handleSignIn() {
    showSignInDialog.value = true
  }

  function handleFullscreen() {
    uiStore.toggleFullscreen()
  }
</script>

<template>
  <!-- Right aligned action group using ButtonGroup -->
  <div class="flex items-center gap-2">
    <ButtonGroup class="flex w-full justify-between md:w-auto md:justify-normal">
      <!-- Reset Button -->
      <ButtonGroup v-if="!uiStore.isMobile">
        <Button size="default" @click="handleResetCustomization">
          <RotateCcw class="size-4" />
          {{ actions_reset_customization({}, { locale: profileStore.currentLocale }) }}
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <!-- Fullscreen Button for mobile only -->
        <ButtonGroup v-if="uiStore.isMobile">
          <Button size="icon" @click="handleFullscreen">
            <Fullscreen class="size-4" />
          </Button>
        </ButtonGroup>
        <!-- Save Button Group with DropdownMenu -->
        <DropdownMenu>
          <ButtonGroup>
            <DropdownMenuTrigger as-child>
              <Button size="default">
                <Save class="size-4" />
                <span>{{ topbar_save({}, { locale: profileStore.currentLocale }) }}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuTrigger as-child>
              <Button
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
      <ButtonGroup v-if="!uiStore.isMobile">
        <Button size="default" @click="showLockerBrowser = true">
          <LayoutGrid class="size-4" />
          <span>{{ topbar_locker_room({}, { locale: profileStore.currentLocale }) }}</span>
        </Button>
      </ButtonGroup>

      <!-- Cart Button -->
      <ButtonGroup v-if="!uiStore.isMobile">
        <Button size="default">
          <ShoppingCart class="size-4" />
          <span>{{ topbar_cart({}, { locale: profileStore.currentLocale }) }}</span>
        </Button>
      </ButtonGroup>

      <!-- Sign In Button with DropdownMenu -->
      <DropdownMenu>
        <ButtonGroup>
          <SignInButton @open-profile="handleUserProfile" />
          <DropdownMenuTrigger as-child>
            <Button size="icon" aria-label="User menu" class="rounded-l-md rounded-r-md">
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
          <DropdownMenuItem v-if="uiStore.isMobile">
            <ShoppingCart class="size-4 mr-2" />
            Cart
          </DropdownMenuItem>
          <DropdownMenuItem v-if="uiStore.isMobile">
            <LayoutGrid class="size-4 mr-2" />
            Locker Room
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="uiStore.isMobile" />

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
        <SignInDialog v-model:open="showSignInDialog" />
      </DropdownMenu>
    </ButtonGroup>
    <LockerBrowser
      :open="showLockerBrowser"
      @update:open="showLockerBrowser = $event"
    />
    <ResetCustomizationDialog v-model:open="showResetDialog" @confirm="confirmResetCustomization" />
  </div>
</template>

<style scoped></style>
