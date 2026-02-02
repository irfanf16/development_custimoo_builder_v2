<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
  } from '@/components/ui/dialog'
  import { resolveDialog, useConfirmDialogState } from '@/lib/confirm-dialog'

  const { isOpen, options } = useConfirmDialogState()

  function onCancel() {
    resolveDialog(false)
  }

  function onConfirm() {
    resolveDialog(true)
  }
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ options.title }}</DialogTitle>
      </DialogHeader>

      <p class="text-sm text-muted-foreground mt-2">
        {{ options.description }}
      </p>

      <DialogFooter class="mt-6 flex gap-2 justify-end">
        <Button variant="outline" @click="onCancel">
          {{ options.cancelText }}
        </Button>
        <Button variant="destructive" @click="onConfirm">
          {{ options.confirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
