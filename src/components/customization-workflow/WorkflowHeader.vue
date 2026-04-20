<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { InputSearchGroup } from '@/components/ui/input-search-group'
  import { Label } from '@/components/ui/label'
  import { Switch } from '@/components/ui/switch'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store.ts'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { storeToRefs } from 'pinia'
  import { Info, Maximize2, Minimize2, Shuffle } from 'lucide-vue-next'
  import { computed, ref } from 'vue'
  import type { BreadcrumbItem, HeaderConfiguration } from './types'
  import WorkflowBreadcrumbs from './WorkflowBreadcrumbs.vue'
  import { DesignCategoryTabs } from './WorkflowSteps'
  import CustomizableStockFilter from './WorkflowSteps/product/CustomizableStockFilter.vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    ui_aria_more_information,
    ui_search_placeholder,
    color_shuffle_design_colors
  } from '@/paraglide/messages'

  interface Props {
    isExpanded?: boolean
    showExpandButton?: boolean
    config: HeaderConfiguration | undefined
  }

  const uiStore = useUIStore()
  const profileStore = useProfileStore()
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const workflowStore = useWorkflowStore()
  const { activeProductDetails } = storeToRefs(productsStore)
  const props = defineProps<Props>()

  const productName = computed(() => activeProductDetails.value?.display_name ?? null)

  const hasSvgParts = computed(() => (productsStore.initialSvgGroups?.length ?? 0) > 0)

  const locale = computed(() => profileStore.currentLocale || 'en')

  const emit = defineEmits<{
    'toggle-expanded': []
    'update:apply-overrides-model-value': [value: boolean]
    'update:search-model-value': [value: string]
  }>()

  // Use props.isExpanded with fallback for internal state
  const isExpanded = computed(() => props.isExpanded ?? false)

  const isExpandable = computed(() => props.config?.isExpandable)
  // Get breadcrumbs from current step component
  const currentBreadcrumbs = computed<BreadcrumbItem[]>(() => props.config?.breadcrumbs ?? [])

  const headerApplyOverrides = computed(() => props.config?.applyOverrides)

  const headerActionButton = computed(() => props.config?.actionButton)

  const showShuffleButton = computed(
    () => isExpanded.value && workflowStore.currentStep === 'designs' && hasSvgParts.value
  )

  const toggleExpanded = () => {
    if (isExpandable.value) {
      emit('toggle-expanded')
    }
  }

  // Model values come from parent; when not provided, default to inert values
  const applyOverridesModelValue = computed({
    get: (): boolean => props.config?.applyOverrides?.value ?? false,
    set: (val: boolean) => emit('update:apply-overrides-model-value', val)
  })

  const searchModelValue = ref('')

  const handleApplyOverridesInput = (val: boolean) => {
    props.config?.applyOverrides?.onInput?.(!!val)
  }

  const handleSearchInput = (val: string) => {
    searchModelValue.value = val
    props.config?.search?.onInput?.(val)
  }

  function shuffleAll() {
    const initialGroups = productsStore.initialSvgGroups ?? []
    if (initialGroups.length === 0 || !customizationStore.customization) return

    const seen = new Set<string>()
    const uniqueByColor = initialGroups.filter(g => {
      const c = (g.color ?? '').trim().toLowerCase()
      if (!c || seen.has(c)) return false
      seen.add(c)
      return true
    })
    const shuffled = [...uniqueByColor].sort(() => Math.random() - 0.5)
    const picked = shuffled.slice(0, 4)

    const defaultColors: Array<{
      color: string | null
      pantone: string | null
      name: string | null
    }> = picked.map(g => ({
      color: g.color ?? null,
      pantone: g.pantone ?? null,
      name: g.name ?? null
    }))
    while (defaultColors.length < 4) {
      defaultColors.push({ color: null, pantone: null, name: null })
    }

    customizationStore.customization.default_colors = defaultColors.slice(0, 4)
    customizationStore.customization.shuffle_color_number = Math.floor(Math.random() * 24) + 1
    customizationStore.customization.group_colors = {}
    workflowStore.setDefaultColorsSource('design')
    workflowStore.setActiveLogoId(null)
    customizationStore.pushHistoryState('Shuffle design colors')
  }
</script>

<template>
  <div class="w-full flex flex-col gap-1">
    <h1 v-if="productName" class="font-medium md:text-sm text-foreground truncate">
      {{ productName }}
    </h1>
    <div
      class="flex items-center gap-2 h-7 justify-center"
      :class="props.config?.isExpandable ? 'h-9' : ''"
    >
      <div class="flex items-center gap-3 flex-1 min-w-0 whitespace-nowrap overflow-hidden">
        <WorkflowBreadcrumbs :breadcrumbs="currentBreadcrumbs" />
      </div>

      <div v-if="headerApplyOverrides !== undefined" class="flex items-center gap-3">
        <Switch
          :model-value="applyOverridesModelValue"
          @update:model-value="val => handleApplyOverridesInput(!!val)"
        />
        <Label class="text-sm font-normal text-muted-foreground">{{
          headerApplyOverrides.label
        }}</Label>
      </div>
      <Button
        v-if="showShuffleButton"
        variant="outline"
        size="sm"
        class="flex items-center gap-2"
        :disabled="!hasSvgParts"
        @click="shuffleAll"
      >
        <Shuffle class="size-4" />
        {{ color_shuffle_design_colors({}, { locale: profileStore.currentLocale }) }}
      </Button>
      <TooltipProvider v-if="headerActionButton">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="default" size="sm" @click="headerActionButton.callback">
              <component :is="headerActionButton.icon" class="size-4" />
              {{ headerActionButton.label }}
            </Button>
          </TooltipTrigger>
          <TooltipContent v-if="headerActionButton.tooltip">
            <p>{{ headerActionButton.tooltip }}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button
        v-if="props.showExpandButton && isExpandable"
        variant="default"
        size="icon"
        class="rounded-lg"
        @click="toggleExpanded"
      >
        <component :is="isExpanded ? Minimize2 : Maximize2" class="size-4" />
      </Button>
    </div>

    <div
      v-if="props.config?.search"
      :class="!uiStore.isMobile ? 'flex flex-col gap-2' : 'flex items-center gap-3'"
    >
      <div class="flex items-center flex-1">
        <div class="relative w-full">
          <InputSearchGroup
            :model-value="searchModelValue"
            :placeholder="
              props.config?.search?.placeholder || ui_search_placeholder({}, { locale: locale })
            "
            @update:model-value="(val: string | number) => handleSearchInput(val as string)"
          />
        </div>
      </div>

      <div v-if="props.config?.customizableStockFilter">
        <CustomizableStockFilter
          :active-filter="props.config?.customizableStockFilter?.activeFilter"
          @update:active-filter="props.config?.customizableStockFilter?.onFilterChange"
        />
      </div>

      <!-- Design Category Tabs - show when configured -->
      <div v-if="props.config?.designCategories">
        <DesignCategoryTabs
          :is-expanded="isExpanded"
          :categories="props.config?.designCategories?.categories"
          :selected-id="props.config?.designCategories?.selectedId"
          :on-select="props.config?.designCategories?.onSelect"
          :default-label="props.config?.designCategories?.defaultLabel"
        />
      </div>
    </div>

    <!-- Improved: Help Text label with an optional tooltip; now more compact and accessible -->
    <div v-if="props.config?.helpText?.label" class="flex items-center gap-2">
      <span class="text-sm">{{ props.config?.helpText?.label }}</span>
      <TooltipProvider v-if="props.config?.helpText?.tooltip">
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              type="button"
              :aria-label="ui_aria_more_information({}, { locale: locale })"
              tabindex="0"
              class="flex items-center focus:outline-none"
            >
              <component :is="Info" class="size-4 text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <span class="text-xs">{{ props.config?.helpText?.tooltip }}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
</template>

<style scoped></style>
