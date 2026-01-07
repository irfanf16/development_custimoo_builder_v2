<script setup lang="ts">
  import ScrollArea from '@/components/ui/scroll-area/ScrollArea.vue'
  import Spinner from '@/components/ui/spinner/Spinner.vue'
  import { Button } from '@/components/ui/button'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
  } from '@/components/ui/dialog'
  import AddressForm from './AddressForm.vue'
  import { computed, onMounted } from 'vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import Card from '@/components/ui/card/Card.vue'
  import CardContent from '@/components/ui/card/CardContent.vue'
  import Badge from '@/components/ui/badge/Badge.vue'
  import { flexFlatCategoryIcons } from '@/icons/flex-flat-categories'
  import { m as messages } from '@/paraglide/messages'
  import { useUIStore } from '@/stores/ui/ui.store'
  import type { Address } from '@/services/customers/types'

  const props = defineProps<{
    showSelectButton?: boolean
  }>()

  const emit = defineEmits<{
    selectAddress: [address: Address]
  }>()

  const store = useProfileStore()
  onMounted(() => {
    store.fetchAddresses()
  })
  function openAddAddressModal() {
    store.editingAddress = null
    store.resetAddressForm() // we'll add this method in store
    store.showAddModal = true
  }

  const t = computed(() => ({
    addressBook: messages.profile_address_book({}, { locale: store.currentLocale }),
    noAddressesAdded: messages.profile_no_addresses_added({}, { locale: store.currentLocale }),
    noAddressesMessage: messages.profile_no_addresses_message({}, { locale: store.currentLocale }),
    addNewAddress: messages.profile_add_new_address({}, { locale: store.currentLocale }),
    business: messages.profile_business({}, { locale: store.currentLocale }),
    personal: messages.profile_personal({}, { locale: store.currentLocale }),
    defaultAddress: messages.profile_default_address({}, { locale: store.currentLocale }),
    setAsDefault: messages.profile_set_as_default({}, { locale: store.currentLocale }),
    edit: messages.profile_edit({}, { locale: store.currentLocale }),
    editAddress: messages.profile_edit_address({}, { locale: store.currentLocale }),
    confirmDelete: messages.profile_confirm_delete({}, { locale: store.currentLocale }),
    confirmDeleteMessage: messages.profile_confirm_delete_message(
      {},
      { locale: store.currentLocale }
    ),
    cancel: messages.profile_cancel({}, { locale: store.currentLocale }),
    yesDelete: messages.profile_yes_delete({}, { locale: store.currentLocale })
  }))
  const uiStore = useUIStore()
</script>
<template>
  <div class="flex flex-col h-full px-4">
    <!-- Header -->
    <div class="sticky top-0 z-10 pb-3 w-max">
      <div class="text-lg font-semibold">{{ t.addressBook }}</div>
    </div>
    <!-- Spinner -->
    <div v-if="store.isLoading" class="flex justify-center items-center flex-1">
      <Spinner class="text-primary size-6" />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!store.addresses.length"
      class="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12"
    >
      <!-- Icon -->
      <div class="flex items-center justify-center rounded-full p-6">
        <component :is="flexFlatCategoryIcons.AddressIcon" class="w-12 h-12 text-primary" />
      </div>

      <!-- Message -->
      <div>
        <h2 class="text-lg font-semibold text-foreground">{{ t.noAddressesAdded }}</h2>
        <p class="text-sm text-muted-foreground mt-1">
          {{ t.noAddressesMessage }}
        </p>
      </div>

      <!-- Button -->
      <Button
        class="bg-primary text-white hover:bg-primary/90 mt-2"
        @click.prevent="openAddAddressModal"
      >
        + {{ t.addNewAddress }}
      </Button>
    </div>

    <!-- Address List -->
    <div class="flex-1 min-h-0">
      <ScrollArea class="h-full overflow-y-auto">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pr-4 pb-4">
          <!-- Address Card -->
          <Card
            v-for="address in store.addresses"
            :key="address.id"
            class="flex flex-col justify-between hover:bg-muted/50 transition-colors"
          >
            <CardContent class="flex flex-col h-full justify-between">
              <!-- Top: Company/Name -->
              <div>
                <div class="flex flex-col gap-2 mb-1">
                  <p class="text-sm font-medium text-muted-foreground">
                    {{ address.company_name ? t.business : t.personal }}
                  </p>
                  <Badge
                    v-if="store.isDefault(address)"
                    variant="default"
                    class="font-normal self-start"
                  >
                    {{ t.defaultAddress }}
                  </Badge>

                  <p class="text-base font-semibold text-foreground">
                    {{
                      address.company_name
                        ? address.company_name
                        : address.first_name + ' ' + address.last_name
                    }}
                  </p>
                </div>

                <!-- Address Details -->
                <div class="text-[14px] text-foreground leading-relaxed mb-4 space-y-0.5">
                  <p v-if="address.address1">{{ address.address1 }}</p>
                  <p v-if="address.address2">{{ address.address2 }}</p>
                  <p>
                    {{ address.zip_code }}&nbsp;
                    {{ address.city }}
                    <span v-if="address.state">, {{ address.state }}</span>
                  </p>
                  <p v-if="address.country?.name">{{ address.country.name }}</p>
                </div>
              </div>

              <!-- Buttons at Bottom -->
              <div class="mt-auto space-y-2 pt-4">
                <!-- Select Address Button (shown when showSelectButton prop is true) -->
                <Button
                  v-if="props.showSelectButton"
                  class="w-full text-xs bg-primary text-white h-8 hover:bg-primary/90"
                  @click="emit('selectAddress', address)"
                >
                  Select this address
                </Button>

                <Button
                  v-if="!store.isDefault(address) && !props.showSelectButton"
                  class="w-full text-xs bg-transparent h-8"
                  variant="outline"
                  @click="store.setDefaultAddress(address)"
                >
                  {{ t.setAsDefault }}
                </Button>

                <div v-if="!props.showSelectButton" class="flex gap-2">
                  <Button
                    class="w-3/4 text-xs bg-transparent h-8"
                    variant="outline"
                    @click="
                      () => {
                        store.editingAddress = address
                        store.showAddModal = true
                      }
                    "
                  >
                    <i-flex-line-edit /> {{ t.edit }}
                  </Button>

                  <Button
                    class="w-1/4 bg-transparent h-8"
                    size="icon"
                    variant="outline"
                    :disabled="store.isDefault(address)"
                    @click="
                      () => {
                        store.addressToDelete = address
                        store.showDeleteConfirm = true
                      }
                    "
                  >
                    <i-flex-line-delete />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Add Address Card -->
          <Card
            v-if="store.addresses.length"
            class="flex flex-col items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <CardContent class="flex flex-col items-center justify-center p-4">
              <!-- Increased icon size -->
              <component :is="flexFlatCategoryIcons.AddressIcon" class="size-12 text-primary" />
              <Button
                class="bg-transparent mt-4 h-8"
                variant="outline"
                @click.prevent="openAddAddressModal"
              >
                + {{ t.addNewAddress }}
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>

    <!-- Add/Edit Modal -->
    <Dialog v-model:open="store.showAddModal">
      <DialogContent
        class="max-w-2xl"
        :class="{
          'fixed w-full max-w-full max-h-[calc(100dvh-5rem)] h-[calc(100dvh-5rem)] bottom-0 left-0 right-0 inset-x-0 -translate-x-0 translate-y-0 transform-none rounded-t-2xl rounded-b-none p-4 overflow-hidden flex flex-col grid-cols-none top-auto':
            uiStore.isMobile
        }"
      >
        <DialogHeader>
          <DialogTitle>{{ store.editingAddress ? t.editAddress : t.addNewAddress }}</DialogTitle>
        </DialogHeader>
        <AddressForm
          v-if="store.showAddModal"
          :address="store.editingAddress"
          @save="store.saveAddress"
          @cancel="store.showAddModal = false"
        />
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation -->
    <Dialog v-model:open="store.showDeleteConfirm">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t.confirmDelete }}</DialogTitle>
          <DialogDescription>{{ t.confirmDeleteMessage }}</DialogDescription>
        </DialogHeader>
        <div class="flex gap-2 justify-end">
          <Button variant="outline" @click="store.showDeleteConfirm = false">{{ t.cancel }}</Button>
          <Button variant="destructive" @click="store.deleteAddress">{{ t.yesDelete }}</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
