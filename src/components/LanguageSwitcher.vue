<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
  } from '@/components/ui/dropdown-menu'
  import { ChevronDown, Globe } from 'lucide-vue-next'
  import {
    useLocaleStore,
    type ParaglideLocale
  } from '@/stores/locale/locale.store'
  import { computed } from 'vue'

  const localeStore = useLocaleStore()

  const shouldShowSwitcher = computed(
    () => localeStore.availableLocales.length > 1
  )

  const handleLanguageChange = (locale: ParaglideLocale) => {
    localeStore.setCurrentLocale(locale)
  }

  const currentLanguageConfig = computed(() => {
    const currentCode = localeStore.currentLocale
    // Find the language config from company store or use a fallback
    return {
      code: currentCode,
      name:
        currentCode === 'en'
          ? 'English'
          : currentCode === 'fr'
            ? 'Français'
            : 'Dansk',
      flag: currentCode === 'en' ? '🇺🇸' : currentCode === 'fr' ? '🇫🇷' : '🇩🇰'
    }
  })

  // Helper function to get language name
  function getLanguageName(locale: ParaglideLocale): string {
    switch (locale) {
      case 'en':
        return 'English'
      case 'fr':
        return 'Français'
      case 'da':
        return 'Dansk'
      default:
        return locale
    }
  }
</script>

<template>
  <!-- Only show language switcher when multiple languages are available -->
  <DropdownMenu v-if="shouldShowSwitcher">
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="default" class="rounded-lg">
        <Globe class="size-4 mr-2" />
        <span>{{ currentLanguageConfig?.flag }}</span>
        <span class="ml-1">{{ currentLanguageConfig?.name }}</span>
        <ChevronDown class="size-4 ml-2" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem
        v-for="locale in localeStore.availableLocales"
        :key="locale"
        :class="{ 'bg-accent': locale === localeStore.currentLocale }"
        @click="handleLanguageChange(locale)"
      >
        <span class="mr-2">
          {{ locale === 'en' ? '🇺🇸' : locale === 'fr' ? '🇫🇷' : '🇩🇰' }}
        </span>
        <span>
          {{ getLanguageName(locale) }}
        </span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<style scoped></style>
