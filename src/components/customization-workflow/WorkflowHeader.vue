<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { Button } from '@/components/ui/button'
  import { Label } from '@/components/ui/label'
  import { Switch } from '@/components/ui/switch'
  import { InputSearchGroup } from '@/components/ui/input-search-group'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
  import { Maximize2, Minimize2 } from 'lucide-vue-next'
  import WorkflowBreadcrumbs from './WorkflowBreadcrumbs.vue'
  import type { BreadcrumbItem } from './types'
  import type { HeaderConfiguration } from './types'

  interface Props {
    isExpanded?: boolean
    showExpandButton?: boolean
    config: HeaderConfiguration | undefined
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    'toggle-expanded': []
    'update:apply-overrides-model-value': [value: boolean]
    'update:search-model-value': [value: string]
  }>()

  // Use props.isExpanded with fallback for internal state
  const isExpanded = computed(() => props.isExpanded ?? false)

  // REMOVE workflowStore/currentHeaderConfig usage; access config from props.config
  // All computed using workflowStore.currentHeaderConfig? -> use props.config?
  const isExpandable = computed(() => props.config?.isExpandable)

  // Get breadcrumbs from current step component
  const currentBreadcrumbs = computed<BreadcrumbItem[]>(() => props.config?.breadcrumbs ?? [])

  const headerApplyOverrides = computed(() => props.config?.applyOverrides)

  const headerActionButton = computed(() => props.config?.actionButton)

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
    props.config?.search?.onInput?.(val)
    console.log('handleSearchInput', val)
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

    <div v-if="props.config?.search" class="flex items-center flex-1">
      <div class="relative w-full">
        <InputSearchGroup
          :model-value="searchModelValue"
          :placeholder="props.config?.search?.placeholder || 'Search...'"
          @update:model-value="(val: string | number) => handleSearchInput(String(val))"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
