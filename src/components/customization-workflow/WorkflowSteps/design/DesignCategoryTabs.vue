<script setup lang="ts">
  import { computed } from 'vue'
  import { MoreHorizontal, Funnel, Check, ChevronDown } from 'lucide-vue-next'
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
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    design_categories_all_button,
    design_categories_more_button,
    design_categories_filters_button,
    design_categories_filter_heading,
    design_categories_filter_all_option
  } from '@/paraglide/messages'

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
  const profileStore = useProfileStore()
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
    return designCategories.value.slice(2)
  })

  // When selection is from the "More" dropdown, show it on the trigger so it's visible from outside
  const selectedFromDropdown = computed(() => {
    const id = isActive.value
    if (id == null) return null
    return dropdownCategories.value.find(c => c.id === id) ?? null
  })

  const moreButtonLabel = computed(() => {
    const cat = selectedFromDropdown.value
    return cat ? cat.category_name : moreLabel.value
  })

  const isMoreButtonSelected = computed(() => selectedFromDropdown.value != null)

  const handleCategoryChange = (categoryId: number | null) => {
    props.onSelect(categoryId ?? null)
  }

  const isActive = computed(() => {
    return props.selectedId ?? selectedDesignCategoryId.value
  })

  const allLabel = computed(() =>
    design_categories_all_button({}, { locale: profileStore.currentLocale })
  )
  const moreLabel = computed(() =>
    design_categories_more_button({}, { locale: profileStore.currentLocale })
  )
  const filtersButtonLabel = computed(() =>
    design_categories_filters_button({}, { locale: profileStore.currentLocale })
  )
  const filterHeadingLabel = computed(() =>
    design_categories_filter_heading({}, { locale: profileStore.currentLocale })
  )
  const filterAllOptionLabel = computed(() =>
    design_categories_filter_all_option({}, { locale: profileStore.currentLocale })
  )
</script>

<template>
  <template v-if="designCategories.length > 0">
    <div
      v-if="!uiStore.isMobile"
      data-testid="workflow-design-category-tabs"
      class="inline-flex items-center justify-start w-full h-auto gap-2"
    >
      <Button
        data-testid="workflow-design-category-all"
        class="rounded-lg transition-colors"
        :class="
          isActive === null
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-white'
            : 'hover:bg-accent hover:text-accent-foreground hover:border hover:border-primary/50'
        "
        size="sm"
        @click="handleCategoryChange(null)"
      >
        {{ allLabel }}
      </Button>
      <Button
        v-for="category in visibleCategories"
        :key="category.id"
        :data-testid="`workflow-design-category-item-${category.id}`"
        class="rounded-lg transition-colors"
        :class="
          isActive === category.id
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-white'
            : 'hover:bg-accent hover:text-accent-foreground hover:border hover:border-primary/50'
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
            data-testid="workflow-design-category-more-trigger"
            size="sm"
            class="rounded-lg transition-colors"
            :class="
              isMoreButtonSelected
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-white'
                : 'hover:bg-accent hover:text-accent-foreground hover:border hover:border-primary/50'
            "
          >
            <MoreHorizontal v-if="!isMoreButtonSelected" class="mr-1 size-4" />
            <ChevronDown v-else class="mr-1 size-4 opacity-90" aria-hidden="true" />
            {{ moreButtonLabel }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" :align-offset="-45" :position-strategy="'absolute'">
          <DropdownMenuItem
            v-for="category in dropdownCategories"
            :key="category.id"
            class="cursor-pointer transition-colors rounded-md"
            :class="
              isActive === category.id
                ? 'bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
            "
            @click="handleCategoryChange(category.id)"
          >
            <Check v-if="isActive === category.id" class="size-4 shrink-0" />
            <span v-else class="w-4 shrink-0" aria-hidden="true" />
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
            {{ filtersButtonLabel }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          :position-strategy="'absolute'"
          :collision-padding="32"
          class="w-[248px] bg-white rounded-lg shadow-md border p-0 mt-1"
        >
          <div class="px-3 py-2.5 font-semibold text-sm">{{ filterHeadingLabel }}</div>
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
            {{ filterAllOptionLabel }}
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
