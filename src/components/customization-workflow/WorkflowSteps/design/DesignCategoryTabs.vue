<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { MoreHorizontal } from 'lucide-vue-next'
  import { Button } from '@/components/ui/button'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
  } from '@/components/ui/dropdown-menu'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { Funnel } from 'lucide-vue-next'

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
  const mobileFiltersOpen = ref(false)

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
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            v-for="category in dropdownCategories"
            :key="category.id"
            :class="isActive === category.id ? 'bg-primary text-white hover:bg-primary' : ''"
            @click="handleCategoryChange(category.id)"
          >
            {{ category.category_name }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <template v-else>
      <DropdownMenu v-if="dropdownCategories.length > 0" v-model:open="mobileFiltersOpen">
        <DropdownMenuTrigger as-child>
          <Button size="sm" class="hover:bg-transparent" :class="mobileFiltersOpen ? '' : ''">
            <Funnel class="size-4 mr-1" />
            Filters
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            class="rounded-lg"
            :class="
              isActive === null
                ? 'bg-primary text-primary-foreground hover:text-white'
                : 'hover:bg-transparent hover:text-primary hover:border hover:border-primary'
            "
            @click="handleCategoryChange(null)"
          >
            All
          </DropdownMenuItem>
          <DropdownMenuItem
            v-for="category in dropdownCategories"
            :key="category.id"
            class="rounded-lg"
            :class="
              isActive === category.id
                ? 'bg-primary text-primary-foreground hover:text-white'
                : 'hover:bg-transparent hover:text-primary hover:border hover:border-primary'
            "
            @click="handleCategoryChange(category.id)"
          >
            {{ category.category_name }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </template>
</template>
