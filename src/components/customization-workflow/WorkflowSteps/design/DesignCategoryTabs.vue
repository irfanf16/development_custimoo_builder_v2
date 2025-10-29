<script setup lang="ts">
  import { computed } from 'vue'
  import { MoreHorizontal, Funnel, Check } from 'lucide-vue-next'
  import { Button } from '@/components/ui/button'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
  } from '@/components/ui/dropdown-menu'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useUIStore } from '@/stores/ui/ui.store'

  interface Props {
    isExpanded?: boolean
    categories?: Array<{
      category_name: string
      created_at: string
      id: number
      updated_at: string
    }>
    selectedId?: number | null
    onSelect: (id: number | null) => void
    defaultLabel?: string
  }

  const uiStore = useUIStore()
  const workflowStore = useWorkflowStore()
  const selectedDesignCategoryId = computed(() => workflowStore.selectedDesignCategoryId)
  const props = defineProps<Props>()

  // Get all design categories from product details
  const designCategories = computed(() => {
    return props.categories || []
  })

  // Split categories: visible ones and ones that go into dropdown
  const visibleCategories = computed(() => {
    if (props.isExpanded || designCategories.value.length <= 3) {
      return designCategories.value
    }
    return designCategories.value.slice(0, 2)
  })

  const dropdownCategories = computed(() => {
    if (props.isExpanded || designCategories.value.length <= 3) {
      return []
    }
    return designCategories.value
  })

  const handleCategoryChange = (categoryId: number | null) => {
    props.onSelect(categoryId ?? null)
  }

  const isActive = computed(() => {
    return props.selectedId ?? selectedDesignCategoryId.value
  })
</script>

<template>
  <template v-if="designCategories.length > 0">
    <div
      v-if="!uiStore.isMobile"
      class="inline-flex items-center justify-start w-full h-auto gap-2"
    >
      <Button
        class="rounded-lg"
        :class="
          isActive === null
            ? 'bg-primary text-primary-foreground hover:text-white'
            : 'hover:bg-transparent hover:text-primary hover:border hover:border-primary'
        "
        size="sm"
        @click="handleCategoryChange(null)"
      >
        All
      </Button>
      <Button
        v-for="category in visibleCategories"
        :key="category.id"
        class="rounded-lg"
        :class="
          isActive === category.id
            ? 'bg-primary text-primary-foreground hover:text-white'
            : 'hover:bg-transparent hover:text-primary hover:border hover:border-primary'
        "
        size="sm"
        @click="handleCategoryChange(category.id)"
      >
        {{ category.category_name }}
      </Button>

      <!-- More dropdown for remaining categories when not expanded -->
      <DropdownMenu v-if="dropdownCategories.length > 0">
        <DropdownMenuTrigger as-child>
          <Button
            size="sm"
            class="hover:bg-transparent hover:text-primary hover:border hover:border-primary"
          >
            <MoreHorizontal class="ml-1 size-4" />
            More
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" :align-offset="-45" :position-strategy="'absolute'">
          <DropdownMenuItem
            v-for="category in dropdownCategories"
            :key="category.id"
            :class="isActive === category.id ? 'bg-primary text-white' : ''"
            @click="handleCategoryChange(category.id)"
          >
            {{ category.category_name }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <template v-else>
      <DropdownMenu v-if="designCategories.length > 0">
        <DropdownMenuTrigger as-child>
          <Button size="sm" class="hover:bg-transparent">
            <Funnel class="size-4 mr-1" />
            Filters
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
              isActive === null
                ? 'bg-transparent text-foreground hover:bg-transparent'
                : 'hover:bg-transparent'
            "
            @click="handleCategoryChange(null)"
          >
            <Check v-if="isActive === null" class="size-4 text-foreground" />
            <span v-else class="w-4"></span>
            All designs
          </DropdownMenuItem>
          <DropdownMenuSeparator class="mx-0 my-0 bg-gray-200" />
          <DropdownMenuItem
            v-for="category in designCategories"
            :key="category.id"
            class="rounded-none px-3 py-2.5 text-sm justify-start gap-2"
            :class="
              isActive === category.id
                ? 'bg-transparent text-foreground hover:bg-transparent'
                : 'hover:bg-transparent'
            "
            @click="handleCategoryChange(category.id)"
          >
            <Check v-if="isActive === category.id" class="size-4 text-foreground" />
            <span v-else class="w-4"></span>
            {{ category.category_name }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </template>
</template>
