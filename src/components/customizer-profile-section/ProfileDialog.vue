<script setup lang="ts">
  import Dialog from '@/components/ui/dialog/Dialog.vue'
  import DialogContent from '@/components/ui/dialog/DialogContent.vue'
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
  import { useProfileDialogState } from '@/composables/useProfileDialogState'

  const props = defineProps<{ open: boolean }>()
  const emit = defineEmits(['update:open'])

  const { tab, tabItems } = useProfileDialogState()
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent :class="'w-[952px] max-w-full p-0 overflow-hidden'">
      <div class="flex h-[600px]">
        <!-- Left: Tabs -->
        <Tabs
          v-model="tab"
          orientation="vertical"
          class="flex flex-col w-[256px] border-r border-border bg-muted/40"
        >
          <div class="flex flex-col h-full py-2">
            <TabsList
              class="flex flex-col gap-2 px-2 py-0 bg-transparent rounded-none border-0 items-stretch"
            >
              <template v-for="item in tabItems" :key="item.value">
                <TabsTrigger
                  :value="item.value"
                  class="flex py-4 px-4 items-center justify-start gap-3 w-full rounded-[6px] transition-colors text-left"
                  :class="tab === item.value ? '!bg-primary/30' : 'bg-transparent text-foreground'"
                >
                  <component :is="item.icon" class="size-6 text-primary" />
                  {{ item.label }}
                </TabsTrigger>
              </template>
            </TabsList>
          </div>
        </Tabs>
        <!-- Right: Content -->
        <div class="flex-1 relative px-4 py-2">
          <Tabs v-model="tab" orientation="vertical" class="h-full">
            <TabsContent value="account" class="h-full">
              <h2 class="text-lg font-semibold mb-4">Account</h2>
              <p>Account details go here.</p>
            </TabsContent>
            <TabsContent value="orders" class="h-full">
              <h2 class="text-lg font-semibold mb-4">Orders</h2>
              <p>Order history goes here.</p>
            </TabsContent>
            <TabsContent value="address" class="h-full">
              <h2 class="text-lg font-semibold mb-4">Address Book</h2>
              <p>Address book goes here.</p>
            </TabsContent>
            <TabsContent value="preferences" class="h-full">
              <h2 class="text-lg font-semibold mb-4">Preferences</h2>
              <p>Preferences go here.</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
