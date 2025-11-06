<script setup lang="ts">
  import ScrollArea from '@/components/ui/scroll-area/ScrollArea.vue'
  import Loader from '@/components/ui/loader/Loader.vue'
  import { Button } from '@/components/ui/button'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
  } from '@/components/ui/dialog'
  import AddressForm from './AddressForm.vue'
  import { onMounted } from 'vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import Card from '@/components/ui/card/Card.vue'
  import CardContent from '@/components/ui/card/CardContent.vue'
  import { flexFlatCategoryIcons } from '@/icons/flex-flat-categories'

  const store = useProfileStore()
  onMounted(store.fetchAddresses)
  function openAddAddressModal() {
    store.editingAddress = null
    store.resetAddressForm() // we'll add this method in store
    store.showAddModal = true
  }
</script>
<template>
  <div class="flex flex-col h-full px-4">
    <!-- Header -->
    <div class="sticky top-0 z-10 pb-3 w-max">
      <div class="text-lg font-semibold">Address Book</div>
    </div>
    <!-- Loader -->
    <div v-if="store.isLoading" class="flex justify-center items-center flex-1">
      <Loader />
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
        <h2 class="text-lg font-semibold text-[#0A0A0A]">No addresses added yet</h2>
        <p class="text-sm text-[#737373] mt-1">
          You haven’t saved any addresses yet. Add one now to make checkout faster.
        </p>
      </div>

      <!-- Button -->
      <Button
        class="bg-primary text-white hover:bg-primary/90 mt-2"
        @click.prevent="openAddAddressModal"
      >
        + Add New Address
      </Button>
    </div>

    <!-- Address List -->
    <ScrollArea class="flex-1 h-full overflow-y-auto">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pr-4 pb-4">
        <!-- Address Card -->
        <Card
          v-for="address in store.addresses"
          :key="address.id"
          class="flex flex-col justify-between"
        >
          <CardContent class="flex flex-col h-full justify-between">
            <!-- Top: Company/Name -->
            <div>
              <div class="flex flex-col gap-2 mb-1">
                <p class="text-sm font-medium text-[#737373]">
                  {{ address.company_name ? 'Business' : 'Personal' }}
                </p>
                <p class="text-base font-semibold text-[#0A0A0A]">
                  {{
                    address.company_name
                      ? address.company_name
                      : address.first_name + ' ' + address.last_name
                  }}
                </p>
                <p v-if="store.isDefault(address)" class="text-sm text-[#737373]">
                  Default address
                </p>
              </div>

              <!-- Address Details -->
              <div class="text-[14px] text-[#0A0A0A] leading-relaxed mb-4 space-y-0.5">
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
              <Button
                v-if="!store.isDefault(address)"
                class="w-full text-xs bg-transparent h-8"
                variant="outline"
                @click="store.setDefaultAddress(address)"
              >
                Set as Default
              </Button>

              <div class="flex gap-2">
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
                  <i-flex-line-edit /> Edit
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
        <Card v-if="store.addresses.length" class="flex flex-col items-center justify-center">
          <CardContent class="flex flex-col items-center justify-center p-4">
            <!-- Increased icon size -->
            <component :is="flexFlatCategoryIcons.AddressIcon" class="size-12 text-primary" />
            <Button
              class="bg-transparent mt-4 h-8"
              variant="outline"
              @click.prevent="openAddAddressModal"
            >
              + Add New Address
            </Button>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>

    <!-- Add/Edit Modal -->
    <Dialog v-model:open="store.showAddModal">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ store.editingAddress ? 'Edit Address' : 'Add New Address' }}</DialogTitle>
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
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>Do you really want to delete this address?</DialogDescription>
        </DialogHeader>
        <div class="flex gap-2 justify-end">
          <Button variant="outline" @click="store.showDeleteConfirm = false">Cancel</Button>
          <Button variant="destructive" @click="store.deleteAddress">Yes, Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
