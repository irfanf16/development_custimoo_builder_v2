<script setup lang="ts">
  import { Icon } from '@iconify/vue'
  import { Button } from '@/components/ui/button'
  import type { ButtonVariants } from '@/components/ui/button'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
  } from '@/components/ui/dropdown-menu'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import { theme_toggle_sr, theme_light, theme_dark } from '@/paraglide/messages'
  import { useProfileStore } from '@/stores/profile/profile.store'

  const uiStore = useUIStore()
  const profileStore = useProfileStore()

  const { currentTheme: colorMode } = storeToRefs(uiStore)

  const props = withDefaults(
    defineProps<{
      variant?: ButtonVariants['variant']
      size?: ButtonVariants['size']
      class?: string
    }>(),
    {
      variant: 'ghost',
      size: 'sm',
      class: 'rounded-xl'
    }
  )

  const setTheme = (theme: 'light' | 'dark') => {
    uiStore.setTheme(theme)
  }

  watch(colorMode, newVal => {
    if (uiStore.widgetRoot) {
      if (newVal === 'dark') {
        uiStore.widgetRoot.classList.remove('light')
        uiStore.widgetRoot.classList.add('dark')
      } else {
        uiStore.widgetRoot.classList.remove('dark')
        uiStore.widgetRoot.classList.add('light')
      }
    }
  })
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button :variant="props.variant" :size="props.size" :class="props.class">
        <Icon
          icon="radix-icons:moon"
          class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        />
        <Icon
          icon="radix-icons:sun"
          class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        />
        <span class="sr-only">{{
          theme_toggle_sr({}, { locale: profileStore.currentLocale })
        }}</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @select="setTheme('light')">{{
        theme_light({}, { locale: profileStore.currentLocale })
      }}</DropdownMenuItem>
      <DropdownMenuItem @select="setTheme('dark')">{{
        theme_dark({}, { locale: profileStore.currentLocale })
      }}</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
