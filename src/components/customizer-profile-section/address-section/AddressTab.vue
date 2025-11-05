<template>
  <div class="flex flex-col h-full px-4">
    <!-- Header -->
    <div class="sticky top-0 z-10 pb-3 w-max">
      <div class="text-lg font-semibold">Addresses</div>
    </div>

    <!-- Loader -->
    <div v-if="isLoading" class="flex justify-center items-center flex-1">
      <Loader />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!addresses || addresses.length === 0"
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-center text-gray-500">
        <p class="text-lg">No addresses added yet</p>
      </div>
    </div>

    <!-- Scrollable Grid -->
    <ScrollArea class="flex-1 h-full overflow-y-auto">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pr-4 pb-4">
        <!-- Address Cards -->
        <div
          v-for="address in addresses"
          :key="address.id"
          class="flex flex-col justify-between bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
        >
          <div>
            <p class="font-semibold text-gray-800">
              {{ address.first_name }} {{ address.last_name }}
            </p>
            <p v-if="address.email" class="text-sm text-gray-600">{{ address.email }}</p>
            <p v-if="address.phone_number" class="text-sm text-gray-600">
              {{ address.phone_number }}
            </p>
            <p v-if="address.company_name" class="text-sm text-gray-600">
              {{ address.company_name }}
            </p>
            <p v-if="address.address1" class="text-sm text-gray-600">{{ address.address1 }}</p>
            <p v-if="address.address2" class="text-sm text-gray-600">{{ address.address2 }}</p>
            <p class="text-sm text-gray-600">
              <span v-if="address.city">{{ address.city }}</span>
              <span v-if="address.city && address.state">, </span>
              <span v-if="address.state">{{ address.state }}</span>
              <span v-if="address.zip_code"> {{ address.zip_code }}</span>
            </p>
            <p v-if="address.country?.name" class="text-sm text-gray-600">
              {{ address.country.name }}
            </p>
          </div>

          <!-- Edit/Delete Buttons -->
          <div class="flex items-center justify-end gap-2 mt-3">
            <Button size="icon" variant="outline" @click="editAddress(address)"> Edit </Button>
            <Button
              v-if="!isDefault(address)"
              size="icon"
              variant="destructive"
              @click="confirmDelete(address)"
            >
              Delete
            </Button>
            <Button v-else size="icon" variant="outline" disabled> Default </Button>
          </div>
        </div>

        <!-- Add New Address Card -->
        <div
          class="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-primary hover:text-primary cursor-pointer transition"
          @click="showAddModal = true"
        >
          <span class="text-2xl font-semibold mb-1">+</span>
          <p class="text-sm font-medium">Add New Address</p>
        </div>
      </div>
    </ScrollArea>

    <!-- Add/Edit Modal -->
    <Dialog v-model:open="showAddModal">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ editingAddress ? 'Edit Address' : 'Add New Address' }}</DialogTitle>
        </DialogHeader>
        <AddressForm
          v-if="showAddModal"
          :address="editingAddress"
          @save="handleSave"
          @cancel="showAddModal = false"
        />
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="showDeleteConfirm">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>Do you really want to delete this address?</DialogDescription>
        </DialogHeader>
        <div class="flex gap-2 justify-end">
          <Button variant="outline" @click="showDeleteConfirm = false">Cancel</Button>
          <Button variant="destructive" @click="handleDelete">Yes, Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { Button } from '@/components/ui/button'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
  } from '@/components/ui/dialog'
  import Loader from '@/components/ui/loader/Loader.vue'
  import { API } from '@/services'
  import type { Address, AddressPayload } from '@/services/addresses/types'
  import AddressForm from './AddressForm.vue'
  import ScrollArea from '@/components/ui/scroll-area/ScrollArea.vue'

  const addresses = ref<Address[]>([])
  const isLoading = ref(false)
  const showAddModal = ref(false)
  const editingAddress = ref<Address | null>(null)
  const showDeleteConfirm = ref(false)
  const addressToDelete = ref<Address | null>(null)

  function isDefault(address: Address): boolean {
    return address.default === true || address.default === 1
  }

  async function fetchAddresses() {
    isLoading.value = true
    try {
      const response = await API.addresses.getAddresses()
      if (response.success) {
        addresses.value = response.result || []
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error)
    } finally {
      isLoading.value = false
    }
  }

  // async function useAddress(address: Address) {
  //   isLoading.value = true
  //   try {
  //     const payload: Partial<AddressPayload> = {
  //       first_name: address.first_name,
  //       last_name: address.last_name,
  //       email: address.email,
  //       phone_number: address.phone_number,
  //       company_name: address.company_name,
  //       address1: address.address1,
  //       address2: address.address2,
  //       city: address.city,
  //       state: address.state,
  //       zip_code: address.zip_code,
  //       country_id: address.country.id
  //     }
  //     const response = await API.addresses.setDefaultAddress(address.id, payload)
  //     if (response.success) {
  //       await fetchAddresses()
  //     }
  //   } catch (error) {
  //     console.error('Failed to set default address:', error)
  //   } finally {
  //     isLoading.value = false
  //   }
  // }

  function editAddress(address: Address) {
    editingAddress.value = address
    showAddModal.value = true
  }

  async function handleSave(payload: AddressPayload) {
    isLoading.value = true
    try {
      let response
      if (editingAddress.value) {
        response = await API.addresses.updateAddress(editingAddress.value.id, payload)
      } else {
        response = await API.addresses.createAddress(payload)
      }
      if (response.success) {
        showAddModal.value = false
        editingAddress.value = null
        await fetchAddresses()
      }
    } catch (error) {
      console.error('Failed to save address:', error)
    } finally {
      isLoading.value = false
    }
  }

  function confirmDelete(address: Address) {
    addressToDelete.value = address
    showDeleteConfirm.value = true
  }

  async function handleDelete() {
    if (!addressToDelete.value) return
    isLoading.value = true
    try {
      const response = await API.addresses.deleteAddress(addressToDelete.value.id)
      if (response.success) {
        showDeleteConfirm.value = false
        addressToDelete.value = null
        await fetchAddresses()
      }
    } catch (error) {
      console.error('Failed to delete address:', error)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    fetchAddresses()
  })
</script>

<style scoped>
  table {
    font-family: arial, sans-serif;
    border-collapse: collapse;
    width: 100%;
  }

  td,
  th {
    border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;
  }
</style>
