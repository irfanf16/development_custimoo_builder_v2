<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { FileSpreadsheet } from 'lucide-vue-next'
  import { Button } from '@/components/ui/button'
  import { Separator } from '@/components/ui/separator'
  import Spinner from '@/components/ui/spinner/Spinner.vue'
  import { useRoster } from './useRoster'
  import { useRosterImporter } from './useRosterImporter'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import RosterEdit from './RosterEdit.vue'
  import {
    colors_choose_from_locker,
    colors_separator_or,
    logos_empty_click_to_upload,
    logos_empty_drag_drop,
    roster_description,
    roster_drop_helper,
    roster_manual_create
  } from '@/paraglide/messages'

  const workflowStore = useWorkflowStore()
  const { rosterSubStep } = storeToRefs(workflowStore)
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const uploadInputId = `roster-upload-${Math.random().toString(36).slice(2)}`
  const { ensureEditableRoster } = useRoster()
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
</script>

<template>
  <div v-if="rosterSubStep === 'list'" class="flex flex-col gap-6 p-4 md:p-6">
    <div class="space-y-1">
      <p class="text-sm text-muted-foreground">
        {{ roster_description({}, { locale }) }}
      </p>
    </div>

    <div class="space-y-4">
      <div
        class="rounded-2xl border border-dashed px-6 py-10 text-center transition-all"
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
        <div
          class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-secondary text-primary"
        >
          <FileSpreadsheet class="size-7" aria-hidden="true" />
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
        <p class="text-xs text-muted-foreground">
          Columns: <span class="font-semibold">NAME ON PRODUCT</span>,
          <span class="font-semibold">NUMBER</span>, <span class="font-semibold">SIZE*</span>,
          <span class="font-semibold">QUANTITY*</span>
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

    <div class="flex flex-col gap-3">
      <Separator class="bg-border" />
      <div
        class="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        {{ colors_separator_or({}, { locale }) }}
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <Button variant="secondary" class="h-11" disabled aria-disabled="true">
          {{ colors_choose_from_locker({}, { locale }) }}
        </Button>
        <Button variant="default" class="h-11" @click="handleManualCreate">
          {{ roster_manual_create({}, { locale }) }}
        </Button>
      </div>
    </div>
  </div>
  <RosterEdit v-else />
</template>

<style scoped></style>
