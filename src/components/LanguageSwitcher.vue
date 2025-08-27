<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
  } from '@/components/ui/dropdown-menu'
  import { ChevronDown, Globe } from 'lucide-vue-next'
  import { useLocaleStore, type ParaglideLocale } from '@/stores/locale'
  import { computed } from 'vue'

  const localeStore = useLocaleStore()

  const shouldShowSwitcher = computed(
    () => localeStore.availableLocales.length > 1
  )

  const handleLanguageChange = (locale: ParaglideLocale) => {
    console.log('Changing language to:', locale)
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
</script>

<template>
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
        @click="handleLanguageChange(locale)"
        :class="{ 'bg-accent': locale === localeStore.currentLocale }"
      >
        <span class="mr-2">
          {{ locale === 'en' ? '🇺🇸' : locale === 'fr' ? '🇫🇷' : '🇩🇰' }}
        </span>
        <span>
          {{
            locale === 'en' ? 'English' : locale === 'fr' ? 'Français' : 'Dansk'
          }}
        </span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<style scoped></style>
