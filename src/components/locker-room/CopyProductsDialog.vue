<script setup lang="ts">
  import { ref, computed } from 'vue'
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
  } from '@/components/ui/dialog'
  import { Input } from '@/components/ui/input'
  import { Button } from '@/components/ui/button'
  import {
    Select,
    SelectTrigger,
    SelectItem,
    SelectContent,
    SelectValue
  } from '@/components/ui/select'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import type { CopyProduct, LockerProduct } from '@/services/lockers/types'
  import { watch } from 'vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    locker_product_name_label,
    locker_product_name_placeholder,
    locker_room_label,
    locker_select_placeholder,
    locker_copy_products_title,
    locker_copy_products_button,
    locker_cancel
  } from '@/paraglide/messages'

  const props = defineProps<{
    open: boolean
    locker_products: LockerProduct[]
  }>()

  const emit = defineEmits(['update:open', 'copy-products'])

  const lockerStore = useLockerRoomStore()
  const profileStore = useProfileStore()
  const lockers = computed(() => lockerStore.lockers)
  const products = computed(() => props.locker_products)
  const locale = computed(() => profileStore.currentLocale || 'en')

  const form = ref<CopyProduct[]>()

  const handleSave = () => {
    emit('copy-products', { products: form.value })
    emit('update:open', false)
  }
  watch(
    () => props.open,
    async (newVal: boolean) => {
      if (newVal) {
        if (!lockers.value.length) {
          await lockerStore.fetchLockers()
        }

        form.value = products.value.map((p: LockerProduct) => {
          return {
            id: p.id,
            name: p.product_name + ' (copy)',
            room_id: lockers.value[0]!.id
          }
        })
      }
    }
  )
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="min-w-xl">
      <DialogHeader>
        <DialogTitle>{{ locker_copy_products_title({}, { locale }) }}</DialogTitle>
      </DialogHeader>

      <ScrollArea class="max-h-[400px] pr-4">
        <div class="space-y-4">
          <div
            v-for="(item, index) in form"
            :key="item.id + index"
            class="p-4 border rounded-lg space-y-3 flex gap-2"
          >
            <div class="w-full">
              <label>{{ locker_product_name_label({}, { locale }) }}</label>
              <Input
                v-model="item.name"
                :placeholder="locker_product_name_placeholder({}, { locale })"
              />
            </div>
            <div class="w-full">
              <label>{{ locker_room_label({}, { locale }) }}</label>
              <Select v-model="item.room_id">
                <SelectTrigger class="w-full">
                  <SelectValue :placeholder="locker_select_placeholder({}, { locale })" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="locker in lockers" :key="locker.id" :value="locker.id">
                    {{ locker.room_name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </ScrollArea>

      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">{{
          locker_cancel({}, { locale })
        }}</Button>
        <Button @click="handleSave">{{ locker_copy_products_button({}, { locale }) }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
