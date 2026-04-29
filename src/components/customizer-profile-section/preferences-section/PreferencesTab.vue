<script setup lang="ts">
  import { onMounted, computed } from 'vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
  } from '@/components/ui/select'
  import { Label } from '@/components/ui/label'
  import type { DisplayMode, ParaglideLocale } from '@/services/preferences/types'
  import { m as messages } from '@/paraglide/messages'
  import { useCompanyStore } from '@/stores/company/company.store'

  const profileStore = useProfileStore()
  const companyStore = useCompanyStore()

  onMounted(() => {
    void profileStore.initializeLocale()
  })

  const t = computed(() => ({
    preferences: messages.profile_preferences({}, { locale: profileStore.currentLocale }),
    display: messages.profile_display({}, { locale: profileStore.currentLocale }),
    selectDisplayMode: messages.profile_select_display_mode(
      {},
      { locale: profileStore.currentLocale }
    ),
    light: messages.profile_light({}, { locale: profileStore.currentLocale }),
    dark: messages.profile_dark({}, { locale: profileStore.currentLocale }),
    language: messages.profile_language({}, { locale: profileStore.currentLocale }),
    selectLanguage: messages.profile_select_language({}, { locale: profileStore.currentLocale }),
    english: messages.profile_language_english({}, { locale: profileStore.currentLocale }),
    french: messages.profile_language_french({}, { locale: profileStore.currentLocale }),
    danish: messages.profile_language_danish({}, { locale: profileStore.currentLocale }),
    spanish: messages.profile_language_spanish({}, { locale: profileStore.currentLocale }),
    german: messages.profile_language_german({}, { locale: profileStore.currentLocale }),
    italian: messages.profile_language_italian({}, { locale: profileStore.currentLocale }),
    dutch: messages.profile_language_dutch({}, { locale: profileStore.currentLocale }),
    norwegian: messages.profile_language_norwegian({}, { locale: profileStore.currentLocale }),
    polish: messages.profile_language_polish({}, { locale: profileStore.currentLocale }),
    swedish: messages.profile_language_swedish({}, { locale: profileStore.currentLocale }),
    portuguese: messages.profile_language_portuguese({}, { locale: profileStore.currentLocale })
  }))

  function getLanguageName(locale: ParaglideLocale) {
    switch (locale) {
      case 'en':
        return t.value.english
      case 'fr':
        return t.value.french
      case 'da':
        return t.value.danish
      case 'es':
        return t.value.spanish
      case 'de':
        return t.value.german
      case 'it':
        return t.value.italian
      case 'nl':
        return t.value.dutch
      case 'no':
        return t.value.norwegian
      case 'pl':
        return t.value.polish
      case 'sv':
        return t.value.swedish
      case 'pt':
        return t.value.portuguese
      default:
        return locale
    }
  }
</script>

<template>
  <div class="flex flex-col h-full px-4">
    <div class="sticky top-0 z-10 pt-4 pb-3">
      <div class="text-lg font-semibold">{{ t.preferences }}</div>
    </div>

    <div class="flex-1 overflow-y-auto pr-2 space-y-6">
      <!-- Display Mode -->
      <!-- Show display mode selector if:
           1. Branding is available and color mode switch is allowed, OR
           2. No branding is available (default case - allow light/dark choice) -->
      <div
        v-if="
          companyStore.settings?.ui_branding?.allow_color_mode_switch ||
          !companyStore.settings?.ui_branding
        "
        class="flex flex-col gap-1"
      >
        <Label for="display">{{ t.display }}</Label>
        <Select
          :key="profileStore.currentLocale"
          v-model="profileStore.preferences.display"
          @update:model-value="
            value => profileStore.setPreferences({ display: value as DisplayMode })
          "
        >
          <SelectTrigger class="w-[10rem] bg-muted">
            <SelectValue :placeholder="t.selectDisplayMode" />
          </SelectTrigger>
          <SelectContent class="max-h-60">
            <SelectItem value="light">{{ t.light }}</SelectItem>
            <SelectItem value="dark">{{ t.dark }}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Language -->
      <div v-if="profileStore.availableLocales.length" class="flex flex-col gap-1">
        <Label for="language">{{ t.language }}</Label>
        <Select
          v-model="profileStore.preferences.language"
          @update:model-value="
            value => profileStore.setPreferences({ language: value as ParaglideLocale })
          "
        >
          <SelectTrigger class="w-[10rem] bg-muted">
            <SelectValue :placeholder="t.selectLanguage" />
          </SelectTrigger>
          <SelectContent class="max-h-60">
            <SelectItem
              v-for="locale in profileStore.availableLocales"
              :key="locale"
              :value="locale"
            >
              {{ getLanguageName(locale) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
</template>
