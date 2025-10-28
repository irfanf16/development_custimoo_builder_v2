<script setup lang="ts">
  import { computed } from 'vue'
  import { Button } from '@/components/ui/button'
  import { Label } from '@/components/ui/label'
  import { Switch } from '@/components/ui/switch'
  import { InputSearchGroup } from '@/components/ui/input-search-group'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
  import { Maximize2, Minimize2 } from 'lucide-vue-next'
  import WorkflowBreadcrumbs from './WorkflowBreadcrumbs.vue'
  import { DesignCategoryTabs } from './WorkflowSteps'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import type { BreadcrumbItem } from './types'
  import { useUIStore } from '@/stores/ui/ui.store'

  interface Props {
    isExpanded?: boolean
    showExpandButton?: boolean
  }

  const uiStore = useUIStore()
  const props = defineProps<Props>()

  const emit = defineEmits<{
    'toggle-expanded': []
    'update:apply-overrides-model-value': [value: boolean]
    'update:search-model-value': [value: string]
  }>()

  const workflowStore = useWorkflowStore()

  // Use props.isExpanded with fallback for internal state
  const isExpanded = computed(() => props.isExpanded ?? false)

  const isExpandable = computed(() => {
    return workflowStore.currentHeaderConfig?.isExpandable
  })

  // Get breadcrumbs from current step component
  const currentBreadcrumbs = computed<BreadcrumbItem[]>(() => {
    return workflowStore.currentHeaderConfig?.breadcrumbs ?? workflowStore.navigationItems
  })

  const headerApplyOverrides = computed(() => {
    return workflowStore.currentHeaderConfig?.applyOverrides
  })

  const headerActionButton = computed(() => {
    return workflowStore.currentHeaderConfig?.actionButton
  })

  const toggleExpanded = () => {
    if (isExpandable.value) {
      emit('toggle-expanded')
    }
  }

  // Bridge nested refs from child steps to primitives for props expecting non-Ref
  const applyOverridesModelValue = computed({
    get: (): boolean => {
      const modelRef = workflowStore.currentHeaderConfig?._refs?.applyOverrides
      // Type assertion needed because _refs stores Ref types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (modelRef as any)?.value ?? false
    },
    set: (val: boolean) => {
      emit('update:apply-overrides-model-value', val)
    }
  })

  const searchModelValue = computed({
    get: (): string => {
      const modelRef = workflowStore.currentHeaderConfig?._refs?.search
      // Type assertion needed because _refs stores Ref types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (modelRef as any)?.value ?? ''
    },
    set: (val: string) => {
      emit('update:search-model-value', val)
    }
  })

  const handleApplyOverridesInput = (val: boolean) => {
    workflowStore.currentHeaderConfig?.applyOverrides?.onInput?.(!!val)
  }

  const handleSearchInput = (val: string) => {
    workflowStore.currentHeaderConfig?.search?.onInput?.(val)
  }
</script>

<template>
  <div class="w-full flex flex-col gap-5">
    <div class="flex items-center gap-3 h-9 justify-center">
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

      <TooltipProvider v-if="headerActionButton">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="default" size="sm" @click="headerActionButton.callback">
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

    <div :class="!uiStore.isMobile ? 'flex flex-col gap-2' : 'flex items-center gap-3'">
      <div v-if="workflowStore.currentHeaderConfig?.search" class="flex items-center flex-1">
        <div class="relative w-full">
          <InputSearchGroup
            :model-value="searchModelValue"
            :placeholder="workflowStore.currentHeaderConfig?.search?.placeholder || 'Search...'"
            :on-input="handleSearchInput"
            @update:model-value="
              (val: string | number) => emit('update:search-model-value', String(val))
            "
          />
        </div>
      </div>

      <!-- Design Category Tabs - show when configured -->
      <div v-if="workflowStore.currentHeaderConfig?.designCategories">
        <DesignCategoryTabs
          :is-expanded="isExpanded"
          :categories="workflowStore.currentHeaderConfig?.designCategories?.categories"
          :selected-id="workflowStore.currentHeaderConfig?.designCategories?.selectedId"
          :on-select="workflowStore.currentHeaderConfig?.designCategories?.onSelect"
          :default-label="workflowStore.currentHeaderConfig?.designCategories?.defaultLabel"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
