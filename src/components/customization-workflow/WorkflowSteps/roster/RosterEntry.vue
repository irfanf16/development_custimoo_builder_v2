<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { Button } from '@/components/ui/button'
  import { Separator } from '@/components/ui/separator'
  import Spinner from '@/components/ui/spinner/Spinner.vue'
  import { useRoster } from './useRoster'
  import { useRosterImporter } from './useRosterImporter'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { useUIStore } from '@/stores/ui/ui.store'
  import RosterEdit from './RosterEdit.vue'
  import {
    colors_choose_from_locker,
    colors_separator_or,
    logos_empty_click_to_upload,
    logos_empty_drag_drop,
    roster_drop_helper,
    roster_manual_create
  } from '@/paraglide/messages'
  import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
  import { useRosterConfig } from './useRosterConfig'

  const workflowStore = useWorkflowStore()
  const authStore = useAuthStore()
  const { isAuthenticated } = storeToRefs(authStore)
  const uiStore = useUIStore()
  const { isMobile } = storeToRefs(uiStore)
  const { rosterSubStep } = storeToRefs(workflowStore)
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const uploadInputId = `roster-upload-${Math.random().toString(36).slice(2)}`
  const { ensureEditableRoster } = useRoster()
  const { footerConfig } = useRosterConfig()
  const {
    isDragging,
    importError,
    isImporting,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    importFile
  } = useRosterImporter()

  function handleManualCreate() {
    ensureEditableRoster()
  }

  function openFilePicker() {
    fileInputRef.value?.click()
  }

  async function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      await importFile(file)
    }
    if (target) target.value = ''
  }

  function handleUpdateOpenMobileEditRoster(open: boolean) {
    if (!open) {
      workflowStore.setRosterSubStep('list')
    }
  }
  const isMobileEditRosterOpen = ref(rosterSubStep.value === 'edit' && isMobile.value)
</script>

<template>
  <div v-if="rosterSubStep === 'list'" class="flex flex-col gap-6 px-4 pb-4 md:px-6 md:pb-6">
    <div class="space-y-4">
      <div
        class="rounded-2xl border border-dashed px-6 py-10 text-center transition-all bg-background m-0"
        :class="[
          isDragging ? 'border-primary bg-primary/5' : 'border-border',
          isImporting ? 'pointer-events-none opacity-70' : 'cursor-pointer'
        ]"
        role="button"
        tabindex="0"
        @click.prevent="openFilePicker"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <div class="mx-auto mb-4 flex size-16 items-center justify-center text-primary">
          <i-other-excel class="size-10" aria-hidden="true" />
        </div>
        <p class="text-base font-medium">
          {{ logos_empty_drag_drop({}, { locale }) }}
          <label
            :for="uploadInputId"
            class="cursor-pointer text-primary underline underline-offset-4 hover:text-primary/80"
            @click.stop
          >
            {{ logos_empty_click_to_upload({}, { locale }) }}
          </label>
        </p>
        <p class="text-sm text-muted-foreground">
          {{ roster_drop_helper({}, { locale }) }}
        </p>
        <div v-if="isImporting" class="mt-4 flex justify-center">
          <Spinner class="size-5 text-primary" />
        </div>
      </div>
      <input
        :id="uploadInputId"
        ref="fileInputRef"
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        class="hidden"
        @change="handleFileChange"
      />
      <p
        v-if="importError"
        class="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ importError }}
      </p>
    </div>

    <div class="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
      <Separator class="flex-1 bg-border" />
      <span class="text-foreground font-medium">{{ colors_separator_or({}, { locale }) }}</span>
      <Separator class="flex-1 bg-border" />
    </div>
    <div class="grid gap-3 sm:grid-cols-2">
      <Button variant="secondary" :disabled="!isAuthenticated" aria-disabled="true">
        {{ colors_choose_from_locker({}, { locale }) }}
      </Button>
      <Button variant="default" @click="handleManualCreate">
        {{ roster_manual_create({}, { locale }) }}
      </Button>
    </div>
  </div>
  <RosterEdit v-else-if="rosterSubStep === 'edit' && !isMobile" />
  <Dialog
    v-else
    :open="isMobileEditRosterOpen"
    variant="large"
    @update:open="handleUpdateOpenMobileEditRoster"
  >
    <DialogContent variant="large" class="p-0 flex flex-col h-full">
      <h1 class="text-lg font-semibold leading-none p-4 bg-background w-full">Roster</h1>
      <RosterEdit class="flex flex-col h-full pt-7 overflow-y-scroll" />
      <DialogFooter class="p-4 border-t">
        <Button
          v-for="button in footerConfig.buttons"
          :key="button.label"
          :variant="button.variant"
          :disabled="button.disabled ?? false"
          class="flex-1"
          @click="button.onClick"
          ><component :is="button.icon" class="size-4" /> <span>{{ button.label }}</span></Button
        >
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped></style>
