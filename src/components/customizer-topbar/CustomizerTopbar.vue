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
    LogOut
  } from 'lucide-vue-next'
  import {
    topbar_save,
    topbar_locker_room,
    topbar_cart,
    topbar_save_options,
    actions_reset_customization
  } from '@/paraglide/messages'
  import { useLocaleStore } from '@/stores/locale/locale.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useHistoryStore } from '@/stores/history/history.store'

  const customizationStore = useCustomizationStore()
  const history = useHistoryStore()
  const localeStore = useLocaleStore()

  function handleResetCustomization() {
    customizationStore.clearCustomization()
    history.clear()
  }

  function handleSaveAsDraft() {
    // Handle save as draft
    console.log('Save as draft')
  }

  function handleSaveAndShare() {
    // Handle save and share
    console.log('Save and share')
  }

  function handleExportDesign() {
    // Handle export design
    console.log('Export design')
  }

  function handleUserProfile() {
    // Handle user profile
    console.log('User profile')
  }

  function handleUserSettings() {
    // Handle user settings
    console.log('User settings')
  }

  function handleSignOut() {
    // Handle sign out
    console.log('Sign out')
  }
</script>

<template>
  <!-- Right aligned action group using ButtonGroup -->
  <div class="flex items-center gap-2">
    <ButtonGroup>
      <!-- Reset Button -->
      <ButtonGroup>
        <Button
          variant="outline"
          size="default"
          @click="handleResetCustomization"
        >
          <RotateCcw class="size-4" />
          {{
            actions_reset_customization(
              {},
              { locale: localeStore.currentLocale }
            )
          }}
        </Button>
      </ButtonGroup>
      <!-- Save Button Group with DropdownMenu -->
      <DropdownMenu>
        <ButtonGroup>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="default">
              <Save class="size-4" />
              <span>{{
                topbar_save({}, { locale: localeStore.currentLocale })
              }}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuTrigger as-child>
            <Button
              variant="outline"
              size="icon"
              :aria-label="
                topbar_save_options({}, { locale: localeStore.currentLocale })
              "
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

      <!-- Locker Room Button -->
      <ButtonGroup>
        <Button variant="outline" size="default">
          <span>{{
            topbar_locker_room({}, { locale: localeStore.currentLocale })
          }}</span>
        </Button>
      </ButtonGroup>

      <!-- Cart Button -->
      <ButtonGroup>
        <Button variant="outline" size="default">
          <ShoppingCart class="size-4" />
          <span>{{
            topbar_cart({}, { locale: localeStore.currentLocale })
          }}</span>
        </Button>
      </ButtonGroup>

      <!-- Sign In Button with DropdownMenu -->
      <DropdownMenu>
        <ButtonGroup>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="default">
              <User class="size-4" />
              <span>Oskar</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="icon" aria-label="User menu">
              <Menu class="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </ButtonGroup>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Oskar</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="handleUserProfile">
            <User class="size-4 mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem @click="handleUserSettings">
            <Settings class="size-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="text-red-600" @click="handleSignOut">
            <LogOut class="size-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  </div>
</template>

<style scoped></style>
