<script setup lang="ts">
  import { Icon } from '@iconify/vue'
  import { Button } from '@/components/ui/button'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
  } from '@/components/ui/dropdown-menu'
  import { useUIStore } from '@/stores/ui'
  import { computed, watch } from 'vue'
  const uiStore = useUIStore()

  const setTheme = (theme: 'light' | 'dark') => {
    uiStore.setTheme(theme)
  }

  const colorMode = computed(() => uiStore.currentTheme)

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
      <Button variant="outline" size="sm">
        <Icon
          icon="radix-icons:moon"
          class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        />
        <Icon
          icon="radix-icons:sun"
          class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        />
        <span class="sr-only">Toggle theme</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="setTheme('light')"> Light </DropdownMenuItem>
      <DropdownMenuItem @click="setTheme('dark')"> Dark </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
