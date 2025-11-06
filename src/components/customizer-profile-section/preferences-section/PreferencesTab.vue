<script setup lang="ts">
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { onMounted } from 'vue'
  import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
  } from '@/components/ui/select' // adjust import path if needed
  import { Label } from '@/components/ui/label'
  import type { DisplayMode } from '@/services/preferences/types'
  // import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

  const profileStore = useProfileStore()

  onMounted(() => {
    profileStore.loadPreferences()
  })
</script>

<template>
  <div class="flex flex-col h-full px-4">
    <div class="sticky top-0 z-10 pb-3">
      <div class="text-lg font-semibold">Preferences</div>
    </div>

    <div class="flex-1 overflow-y-auto pr-2 space-y-6">
      <!-- Display -->
      <div class="flex flex-col gap-1">
        <Label for="display">Display</Label>
        <Select
          v-model="profileStore.preferences.display"
          @update:model-value="
            value =>
              profileStore.setPreferences({
                display: (value ?? undefined) as DisplayMode
              })
          "
        >
          <SelectTrigger class="w-[360px]">
            <SelectValue placeholder="Select display mode" />
          </SelectTrigger>
          <SelectContent class="max-h-60">
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System Default</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Language -->
      <div class="flex flex-col gap-1">
        <Label for="language">Language</Label>
        <Select
          v-model="profileStore.preferences.language"
          @update:model-value="
            value =>
              profileStore.setPreferences({
                language: typeof value === 'string' ? value : undefined
              })
          "
        >
          <SelectTrigger class="w-[360px]">
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent class="max-h-60">
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="de">German</SelectItem>
          </SelectContent>
        </Select>
        <!-- <LanguageSwitcher/> -->
      </div>
    </div>
  </div>
</template>
