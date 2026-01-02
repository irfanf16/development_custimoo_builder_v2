<script setup lang="ts">
  import { Card } from '@/components/ui/card'
  import { DotSeparator } from '@/components/ui/separator'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, ref } from 'vue'
  import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
  import { Button } from '@/components/ui/button'
  import { ButtonGroup } from '@/components/ui/button-group'
  import { Input } from '@/components/ui/input'
  import { Spinner } from '@/components/ui/spinner'
  import { PLACEHOLDER_IMAGE } from '@/helpers/imageHelper'
  import { Check, X, Calendar, ShoppingBag, InfoIcon } from 'lucide-vue-next'
  import { timeAgo } from '@/lib/utils'
  import AvatarQueue from '../ui/avatar-queue/AvatarQueue.vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    locker_name_placeholder,
    locker_designs_count,
    locker_auto_generated,
    locker_auto_generated_tooltip,
    time_ago_just_now,
    time_ago_seconds,
    time_ago_seconds_plural,
    time_ago_minutes,
    time_ago_minutes_plural,
    time_ago_hours,
    time_ago_hours_plural,
    time_ago_days,
    time_ago_days_plural,
    time_ago_yesterday,
    time_ago_months,
    time_ago_months_plural,
    time_ago_years,
    time_ago_years_plural
  } from '@/paraglide/messages'
  const props = withDefaults(
    defineProps<{
      search: null | string
    }>(),
    {
      search: null
    }
  )

  const emit = defineEmits([
    'select-collection',
    'edit-locker',
    'copy-locker',
    'open-locker',
    'open-collection'
  ])
  const lockerRoomStore = useLockerRoomStore()
  const profileStore = useProfileStore()
  const isCreatingCollection = ref<boolean>(false)
  const { isLoading, collections } = storeToRefs(lockerRoomStore)
  const locale = computed(() => profileStore.currentLocale || 'en')

  onMounted(() => {
    if (!collections.value.length) {
      lockerRoomStore.fetchCollections()
    }
  })
  const editingIndex = ref<number | null>(null)
  const editName = ref<string>('')

  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const computedCollections = computed(() => collections.value)
  const filteredCollections = computed(() => {
    return computedCollections.value.filter(c =>
      c.name.toLowerCase().includes(props.search?.toLowerCase() || '')
    )
  })

  const timeAgoMessages = computed(() => ({
    just_now: () => time_ago_just_now({}, { locale: locale.value }),
    seconds: (params: { count: number }) => time_ago_seconds(params, { locale: locale.value }),
    seconds_plural: (params: { count: number }) =>
      time_ago_seconds_plural(params, { locale: locale.value }),
    minutes: (params: { count: number }) => time_ago_minutes(params, { locale: locale.value }),
    minutes_plural: (params: { count: number }) =>
      time_ago_minutes_plural(params, { locale: locale.value }),
    hours: (params: { count: number }) => time_ago_hours(params, { locale: locale.value }),
    hours_plural: (params: { count: number }) =>
      time_ago_hours_plural(params, { locale: locale.value }),
    days: (params: { count: number }) => time_ago_days(params, { locale: locale.value }),
    days_plural: (params: { count: number }) =>
      time_ago_days_plural(params, { locale: locale.value }),
    yesterday: () => time_ago_yesterday({}, { locale: locale.value }),
    months: (params: { count: number }) => time_ago_months(params, { locale: locale.value }),
    months_plural: (params: { count: number }) =>
      time_ago_months_plural(params, { locale: locale.value }),
    years: (params: { count: number }) => time_ago_years(params, { locale: locale.value }),
    years_plural: (params: { count: number }) =>
      time_ago_years_plural(params, { locale: locale.value })
  }))

  const localizedTimeAgo = (dateTime: string) => timeAgo(dateTime, timeAgoMessages.value)

  function createCollection() {
    isCreatingCollection.value = true
  }
  // const saveCollection = async () => {
  //   if (!room_name.value) return
  //   // await lockerRoomStore.createCollection(room_name.value as string)
  //   isCreatingCollection.value = false
  //   room_name.value = undefined
  // }

  async function saveEdit(locker: any) {
    if (!editName.value.length) return

    const updated = { ...locker, room_name: editName.value }

    await lockerRoomStore.updateLockers(updated)

    editingIndex.value = null
    editName.value = ''
  }

  function cancelEdit() {
    editingIndex.value = null
    editName.value = ''
  }
  defineExpose({ createCollection })
</script>

<template>
  <Spinner v-if="isLoading" class="size-8 text-primary m-auto mb-4" />
  <div v-else class="grid grid-cols-1 gap-6 relative group">
    <Card
      v-for="(collection, collectionIndex) in filteredCollections"
      :key="collection.id"
      class="group rounded-lg cursor-pointer md:py-0 p-0 bg-transparent relative gap-2! h-fit duration-150 border-0 flex flex-row"
      @click="emit('open-collection', collection)"
    >
      <div
        class="bg-secondary rounded-md md:aspect-video flex justify-center items-center overflow-hidden gap-1 place-items-start p-[10px] border relative"
      >
        <template v-if="collection.collection_products.length">
          <AvatarQueue
            :size="'60'"
            :images="
              collection.collection_products
                .slice(0, 3)
                .map(prod => baseStorageUrl + prod.product_locker_room.product_url)
            "
            :max="3"
            :class="'overflow-hidden mr-2'"
            :avatar-class="'!rounded-[13px] border-0 !ring-0 !bg-transparent !shadow-none '"
          />
        </template>
        <template v-else>
          <img
            :src="PLACEHOLDER_IMAGE"
            class="h-full overflow-hidden object-contain rounded-md mx-auto w-full"
          />
        </template>
      </div>

      <!-- Edit Mode -->
      <div
        v-if="editingIndex === collectionIndex"
        class="metadata flex gap-2 pt-2 items-center"
        @click.stop
      >
        <Input
          v-model="editName"
          :placeholder="locker_name_placeholder({}, { locale })"
          class="flex-1"
        />

        <ButtonGroup>
          <Button variant="primary" size="default" @click.stop="saveEdit(collection)">
            <Check class="size-4" />
          </Button>

          <Button size="default" variant="secondary" @click.stop="cancelEdit">
            <X class="size-4" />
          </Button>
        </ButtonGroup>
      </div>

      <!-- Normal Metadata -->
      <div
        v-else
        class="metadata flex flex-col justify-center"
        @click.stop="emit('open-collection', collection)"
      >
        <div class="mt-2 text-base font-medium">{{ collection.name }}</div>
        <div class="text-sm text-muted-foreground flex gap-1 items-center">
          <span class="flex items-center gap-1">
            <ShoppingBag class="size-3.5 inline-block" />
            {{ collection.collection_products.length }}
            {{ locker_designs_count({}, { locale }) }}
          </span>
          <DotSeparator class="bg-muted-foreground" />
          <span class="flex items-center gap-1">
            <Calendar class="size-3.5 inline-block" />
            {{ localizedTimeAgo(collection.updated_at) }}
          </span>
          <template v-if="collection.room_id">
            <DotSeparator class="bg-muted-foreground" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span class="flex items-center gap-1">
                    <InfoIcon class="size-3.5 inline-block" />
                    {{ locker_auto_generated({}, { locale }) }}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{{ locker_auto_generated_tooltip({}, { locale }) }}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </template>
        </div>
      </div>
    </Card>
  </div>
</template>
