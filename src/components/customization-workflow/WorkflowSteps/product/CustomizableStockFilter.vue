<script setup lang="ts">
  import { computed } from 'vue'
  import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator
  } from '@/components/ui/dropdown-menu'
  import { Button } from '@/components/ui/button'
  import { Check, Funnel } from 'lucide-vue-next'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { storeToRefs } from 'pinia'
  import type { StockFilterOption } from './config'

  const uiStore = useUIStore()
  const { isMobile } = storeToRefs(uiStore)

  interface Props {
    activeFilter: StockFilterOption | null
  }

  interface Emits {
    (e: 'update:activeFilter', value: StockFilterOption): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // Sync prop changes to ensure reactivity
  const isActive = computed({
    get: () => props.activeFilter ?? 'all',
    set: (value: StockFilterOption) => {
      emit('update:activeFilter', value)
    }
  })

  const handleFilterChange = (filterId: StockFilterOption) => {
    isActive.value = filterId
  }
</script>
<template>
  <DropdownMenu v-if="isMobile">
    <DropdownMenuTrigger as-child>
      <Button size="sm" :variant="isActive === 'all' ? 'outline' : 'primary'">
        <Funnel class="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="start"
      :position-strategy="'absolute'"
      :collision-padding="32"
      class="w-[248px] bg-white rounded-lg shadow-md border p-0 mt-1"
    >
      <div class="px-3 py-2.5 font-semibold text-sm">Filter</div>
      <DropdownMenuItem
        class="rounded-none px-3 py-2.5 text-sm justify-start gap-2"
        :class="
          isActive === 'all'
            ? 'bg-transparent text-foreground hover:bg-transparent'
            : 'hover:bg-transparent'
        "
        @click="handleFilterChange('all')"
      >
        <Check v-if="isActive === 'all'" class="size-4 text-foreground" />
        <span v-else class="w-4"></span>
        All
      </DropdownMenuItem>
      <DropdownMenuSeparator class="mx-0 my-0 bg-gray-200" />
      <DropdownMenuItem
        :key="'customized'"
        class="rounded-none px-3 py-2.5 text-sm justify-start gap-2"
        :class="
          isActive === 'customized'
            ? 'bg-transparent text-foreground hover:bg-transparent'
            : 'hover:bg-transparent'
        "
        @click="handleFilterChange('customized')"
      >
        <Check v-if="isActive === 'customized'" class="size-4 text-foreground" />
        <span v-else class="w-4"></span>
        Bespoke
      </DropdownMenuItem>
      <DropdownMenuItem
        :key="'personalized'"
        class="rounded-none px-3 py-2.5 text-sm justify-start gap-2"
        :class="
          isActive === 'personalized'
            ? 'bg-transparent text-foreground hover:bg-transparent'
            : 'hover:bg-transparent'
        "
        @click="handleFilterChange('personalized')"
      >
        <Check v-if="isActive === 'personalized'" class="size-4 text-foreground" />
        <span v-else class="w-4"></span>
        Stock
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
  <div v-else>
    <div class="flex gap-2">
      <Button
        size="sm"
        :variant="isActive === 'all' ? 'primary' : 'outline'"
        @click="handleFilterChange('all')"
      >
        All
      </Button>
      <Button
        size="sm"
        :variant="isActive === 'customized' ? 'primary' : 'outline'"
        @click="handleFilterChange('customized')"
      >
        Bespoke
      </Button>
      <Button
        size="sm"
        :variant="isActive === 'personalized' ? 'primary' : 'outline'"
        @click="handleFilterChange('personalized')"
      >
        Stock
      </Button>
    </div>
  </div>
</template>
